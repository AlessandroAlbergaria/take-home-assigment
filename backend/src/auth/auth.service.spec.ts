import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

const mockUser = {
  id: 1,
  email: 'test@example.com',
  password: 'hashedPassword',
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;

  beforeEach(async () => {
    usersService = {
      findOneByEmail: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-jwt-token'),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    authService = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should throw if email or password is missing', async () => {
      await expect(authService.validateUser('', '123')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(
        authService.validateUser('test@example.com', ''),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if user not found', async () => {
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(null);
      await expect(
        authService.validateUser('test@example.com', '123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if password does not match', async () => {
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      await expect(
        authService.validateUser('test@example.com', 'wrong'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return token if credentials are valid', async () => {
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      const result = await authService.validateUser(
        'test@example.com',
        'correct',
      );
      expect(result).toEqual({ access_token: 'signed-jwt-token' });
    });
  });

  describe('generateToken', () => {
    it('should return an access token', async () => {
      const result = await authService.generateToken(mockUser as any);
      expect(result).toEqual({ access_token: 'signed-jwt-token' });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email },
        expect.objectContaining({
          secret: process.env.JWT_ACCESS_SECRET,
          expiresIn: expect.anything(),
        }),
      );
    });
  });
});
