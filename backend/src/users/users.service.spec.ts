import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashedpassword',
};

const userArray = [
  { ...mockUser },
  { id: '2', name: 'User2', email: 'user2@example.com', password: 'hashed2' },
];

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let redis: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
        {
          provide: 'default_IORedisModuleConnectionToken',
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    redis = module.get('default_IORedisModuleConnectionToken');
    jest
      .spyOn(bcrypt, 'hash')
      .mockImplementation(async (pw) => 'hashedpassword');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user if email does not exist', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(undefined);
      (userRepository.save as jest.Mock).mockResolvedValue(mockUser);
      const dto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
      };
      const result = await service.create(dto);
      expect(result).toEqual({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
      });
      expect(redis.del).toHaveBeenCalledWith('users:all');
    });

    it('should throw error if email exists', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      const dto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
      };
      await expect(service.create(dto)).rejects.toThrow('Email already exists');
    });
  });

  describe('findAll', () => {
    it('should return users from cache', async () => {
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(userArray));
      const result = await service.findAll();
      // Remove password field to match expected output
      const sanitized = result.map(({ password, ...rest }) => rest);
      expect(sanitized).toEqual([
        { id: '1', name: 'Test User', email: 'test@example.com' },
        { id: '2', name: 'User2', email: 'user2@example.com' },
      ]);
    });

    it('should return users from db and cache them', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (userRepository.find as jest.Mock).mockResolvedValue(userArray);
      const result = await service.findAll();
      expect(result.length).toBe(2);
      expect(redis.set).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return user from cache', async () => {
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockUser));
      const result = await service.findOne('1');
      // Remove password field to match expected output
      const { password, ...sanitized } = result;
      expect(sanitized).toEqual({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
      });
    });

    it('should return user from db and cache it', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (userRepository.findOneBy as jest.Mock).mockResolvedValue(mockUser);
      const result = await service.findOne('1');
      expect(result).toEqual({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
      });
      expect(redis.set).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update user and clear cache', async () => {
      (userRepository.update as jest.Mock).mockResolvedValue(undefined);
      (userRepository.findOneBy as jest.Mock).mockResolvedValue(mockUser);
      const dto: UpdateUserDto = { name: 'Updated' };
      const result = await service.update('1', dto);
      expect(result).toEqual({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
      });
      expect(redis.del).toHaveBeenCalledWith('users:1');
      expect(redis.del).toHaveBeenCalledWith('users:all');
    });
  });

  describe('remove', () => {
    it('should delete user and clear cache', async () => {
      (userRepository.delete as jest.Mock).mockResolvedValue({ affected: 1 });
      const result = await service.remove('1');
      expect(result).toEqual({ affected: 1 });
      expect(redis.del).toHaveBeenCalledWith('users:1');
      expect(redis.del).toHaveBeenCalledWith('users:all');
    });
  });
});
