import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

const mockUsersService = {
  findOneByEmail: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should validate a user and return token', async () => {
    const user = { email: 'john@example.com', password: 'password123' };
    mockUsersService.findOneByEmail.mockResolvedValue(user);
    mockJwtService.sign.mockReturnValue('token');

    const result = await service.validateUser(user.email, user.password);

    expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(user.email);
    expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ access_token: 'token' });
  });

  it('should throw UnauthorizedException for invalid credentials', async () => {
    mockUsersService.findOneByEmail.mockResolvedValue(null);

    await expect(
      service.validateUser('john@example.com', 'wrongpassword'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
