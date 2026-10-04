import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/schemas/user.schema';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: {
    create: jest.Mock;
    findByEmail: jest.Mock;
    updateRefreshToken: jest.Mock;
  };
  let jwtService: {
    sign: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      updateRefreshToken: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        if (key === 'JWT_ACCESS_SECRET') return 'test_access_secret';
        if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret';
        if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
        if (key === 'NODE_ENV') return 'test';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register (TC-001, TC-002)', () => {
    it('TC-001: should register user successfully and return user details without password', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'Password123',
        fullName: 'Nguyen Van A',
      };

      const mockSavedUser = {
        _id: 'user_123',
        email: 'test@example.com',
        fullName: 'Nguyen Van A',
        role: UserRole.CUSTOMER,
        isActive: true,
      };

      usersService.create.mockResolvedValue(mockSavedUser);

      const result = await authService.register(dto);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          fullName: 'Nguyen Van A',
        }),
      );
      expect(result).toEqual({
        userId: 'user_123',
        email: 'test@example.com',
        fullName: 'Nguyen Van A',
      });
    });

    it('TC-002: should propagate ConflictException if email already exists', async () => {
      usersService.create.mockRejectedValue(
        new ConflictException('Email đã tồn tại trên hệ thống'),
      );

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'Password123',
          fullName: 'Existing User',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login (TC-003, TC-004, TC-005)', () => {
    const mockCookie = jest.fn();
    const mockRes = {
      cookie: mockCookie,
    } as unknown as Response;

    it('TC-003: should authenticate valid user, issue tokens, hash refresh token, and set cookie', async () => {
      const hashedPassword = await bcrypt.hash('Password123', 10);
      const mockUser = {
        _id: 'user_123',
        email: 'test@example.com',
        password: hashedPassword,
        fullName: 'Nguyen Van A',
        role: UserRole.CUSTOMER,
        isActive: true,
        shopName: null,
      };

      usersService.findByEmail.mockResolvedValue(mockUser);
      jwtService.sign
        .mockReturnValueOnce('mock_access_token')
        .mockReturnValueOnce('mock_refresh_token');

      const result = await authService.login(
        { email: 'test@example.com', password: 'Password123' },
        mockRes,
      );

      expect(result).toEqual({
        accessToken: 'mock_access_token',
        user: {
          id: 'user_123',
          email: 'test@example.com',
          fullName: 'Nguyen Van A',
          role: 'customer',
          shopName: null,
        },
      });

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        'user_123',
        expect.any(String), // hashed refresh token
      );

      expect(mockCookie).toHaveBeenCalledWith(
        'refreshToken',
        'mock_refresh_token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/api/v1/auth',
        }),
      );
    });

    it('TC-004: should throw UnauthorizedException on wrong password', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword', 10);
      const mockUser = {
        _id: 'user_123',
        email: 'test@example.com',
        password: hashedPassword,
        isActive: true,
      };

      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.login(
          { email: 'test@example.com', password: 'WrongPassword' },
          mockRes,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('TC-004: should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login(
          { email: 'notfound@example.com', password: 'Password123' },
          mockRes,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('TC-005: should throw ForbiddenException if user isActive is false', async () => {
      const hashedPassword = await bcrypt.hash('Password123', 10);
      const mockUser = {
        _id: 'user_123',
        email: 'banned@example.com',
        password: hashedPassword,
        isActive: false,
      };

      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.login(
          { email: 'banned@example.com', password: 'Password123' },
          mockRes,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
