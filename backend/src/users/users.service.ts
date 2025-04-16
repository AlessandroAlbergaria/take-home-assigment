import { Injectable } from '@nestjs/common';
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

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRedis() private readonly redis: Redis,
  ) {
    this.cacheTTL = parseInt(process.env.REDIS_CACHE_TTL, 10) || 3600;
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const userToSave = { ...createUserDto, password: hashedPassword };
    const user = await this.userRepository.save(userToSave);
    await this.redis.del('users:all');
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll() {
    const cacheKey = 'users:all';
    const cachedUsers = await this.redis.get(cacheKey);

    if (cachedUsers) {
      return JSON.parse(cachedUsers).map(({ password, ...user }) => user);
    }

    const users = await this.userRepository.find();
    const usersWithoutPassword = users.map(({ password, ...user }) => user);
    await this.redis.set(
      cacheKey,
      JSON.stringify(usersWithoutPassword),
      'EX',
      this.cacheTTL,
    );
    return usersWithoutPassword;
  }

  async findOne(id: string) {
    const cacheKey = `users:${id}`;
    const cachedUser = await this.redis.get(cacheKey);

    if (cachedUser) {
      const { password, ...user } = JSON.parse(cachedUser);
      return user;
    }

    const user = await this.userRepository.findOneBy({ id: id });
    if (user) {
      const { password, ...userWithoutPassword } = user;
      await this.redis.set(
        cacheKey,
        JSON.stringify(userWithoutPassword),
        'EX',
        this.cacheTTL,
      );
      return userWithoutPassword;
    }
    return user;
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.userRepository.update(id, updateUserDto);
    await this.redis.del(`users:${id}`);
    await this.redis.del('users:all');
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return user;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async remove(id: string) {
    const result = await this.userRepository.delete(id);
    await this.redis.del(`users:${id}`);
    await this.redis.del('users:all');
    return result;
  }
}
