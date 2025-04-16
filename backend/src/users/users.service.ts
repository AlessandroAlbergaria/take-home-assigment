import {
  Injectable,
  Logger,
  LoggerService,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../entities/user.entity';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  private readonly cacheTTL: number;
  private readonly logger: LoggerService;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRedis() private readonly redis: Redis,
  ) {
    this.cacheTTL = parseInt(process.env.REDIS_CACHE_TTL, 10) || 3600;
    this.logger = new Logger(UsersService.name);
  }

  private getAllUsersCacheKey() {
    return 'users:all';
  }
  private getUserCacheKey(id: string) {
    return `users:${id}`;
  }
  private async invalidateUserCache(id?: string) {
    await this.redis.del(this.getAllUsersCacheKey());
    if (id) await this.redis.del(this.getUserCacheKey(id));
  }

  async create(createUserDto: CreateUserDto) {
    this.logger.log(`Creating user with email: ${createUserDto.email}`);
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      this.logger.warn(
        `Attempt to create user with existing email: ${createUserDto.email}`,
      );
      throw new ConflictException('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const userToSave = { ...createUserDto, password: hashedPassword };
    const user = await this.userRepository.save(userToSave);
    await this.invalidateUserCache();
    const { password, ...userWithoutPassword } = user;
    this.logger.log(`User created with id: ${user.id}`);
    return userWithoutPassword;
  }

  async findAll() {
    this.logger.log('Fetching all users');
    const cacheKey = this.getAllUsersCacheKey();
    const cachedUsers = await this.redis.get(cacheKey);
    if (cachedUsers) {
      this.logger.debug('Users found in cache');
      return JSON.parse(cachedUsers);
    }
    const users = await this.userRepository.find();
    const usersWithoutPassword = users.map(({ password, ...user }) => user);
    await this.redis.set(
      cacheKey,
      JSON.stringify(usersWithoutPassword),
      'EX',
      this.cacheTTL,
    );
    this.logger.log('Users fetched from database and cached');
    return usersWithoutPassword;
  }

  async findOne(id: string) {
    this.logger.log(`Fetching user with id: ${id}`);
    const cacheKey = this.getUserCacheKey(id);
    const cachedUser = await this.redis.get(cacheKey);
    if (cachedUser) {
      this.logger.debug(`User ${id} found in cache`);
      return JSON.parse(cachedUser);
    }
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      this.logger.warn(`User ${id} not found`);
      throw new NotFoundException('User not found');
    }
    const { password, ...userWithoutPassword } = user;
    await this.redis.set(
      cacheKey,
      JSON.stringify(userWithoutPassword),
      'EX',
      this.cacheTTL,
    );
    this.logger.log(`User ${id} fetched from database and cached`);
    return userWithoutPassword;
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    this.logger.log(`Fetching user by email: ${email}`);
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    this.logger.log(`Updating user with id: ${id}`);
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    await this.userRepository.update(id, updateUserDto);
    await this.invalidateUserCache(id);
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      this.logger.warn(`User ${id} not found for update`);
      throw new NotFoundException('User not found');
    }
    const { password, ...userWithoutPassword } = user;
    this.logger.log(`User ${id} updated`);
    return userWithoutPassword;
  }

  async remove(id: string) {
    this.logger.log(`Removing user with id: ${id}`);
    const result = await this.userRepository.delete(id);
    await this.invalidateUserCache(id);
    this.logger.log(`User ${id} removed`);
    return result;
  }
}
