import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import Redis from 'ioredis';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: Redis,
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a user', async () => {
    const createUserDto: CreateUserDto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    mockUserRepository.findOne.mockResolvedValue(null);
    mockUserRepository.save.mockResolvedValue({ id: 'uuid', ...createUserDto });

    const result = await service.create(createUserDto);

    expect(mockUserRepository.findOne).toHaveBeenCalledWith({
      where: { email: createUserDto.email },
    });
    expect(mockUserRepository.save).toHaveBeenCalledWith(createUserDto);
    expect(mockRedis.del).toHaveBeenCalledWith('users:all');
    expect(result).toEqual({ id: 'uuid', ...createUserDto });
  });

  it('should throw an error if email already exists', async () => {
    const createUserDto: CreateUserDto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    mockUserRepository.findOne.mockResolvedValue({
      id: 'uuid',
      ...createUserDto,
    });

    await expect(service.create(createUserDto)).rejects.toThrow(
      'Email already exists',
    );
  });

  it('should return all users from cache', async () => {
    const cachedUsers = JSON.stringify([
      { id: 'uuid', name: 'John Doe', email: 'john@example.com' },
    ]);
    mockRedis.get.mockResolvedValue(cachedUsers);

    const result = await service.findAll();

    expect(mockRedis.get).toHaveBeenCalledWith('users:all');
    expect(result).toEqual(JSON.parse(cachedUsers));
  });

  it('should return all users from database if not cached', async () => {
    const users = [{ id: 'uuid', name: 'John Doe', email: 'john@example.com' }];
    mockRedis.get.mockResolvedValue(null);
    mockUserRepository.find.mockResolvedValue(users);

    const result = await service.findAll();

    expect(mockRedis.get).toHaveBeenCalledWith('users:all');
    expect(mockUserRepository.find).toHaveBeenCalled();
    expect(mockRedis.set).toHaveBeenCalledWith(
      'users:all',
      JSON.stringify(users),
      'EX',
      3600,
    );
    expect(result).toEqual(users);
  });

  it('should update a user', async () => {
    const updateUserDto: UpdateUserDto = { name: 'Jane Doe' };
    mockUserRepository.update.mockResolvedValue({ affected: 1 });

    const result = await service.update('uuid', updateUserDto);

    expect(mockUserRepository.update).toHaveBeenCalledWith(
      'uuid',
      updateUserDto,
    );
    expect(mockRedis.del).toHaveBeenCalledWith('users:uuid');
    expect(mockRedis.del).toHaveBeenCalledWith('users:all');
    expect(result).toEqual({ affected: 1 });
  });

  it('should delete a user', async () => {
    mockUserRepository.delete.mockResolvedValue({ affected: 1 });

    const result = await service.remove('uuid');

    expect(mockUserRepository.delete).toHaveBeenCalledWith('uuid');
    expect(mockRedis.del).toHaveBeenCalledWith('users:uuid');
    expect(mockRedis.del).toHaveBeenCalledWith('users:all');
    expect(result).toEqual({ affected: 1 });
  });
});
