import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

const mockResponse = () => {
  const cookies: Record<string, unknown> = {};
  return {
    cookie: jest.fn((name: string, value: string, opts: unknown) => {
      cookies[name] = { value, opts };
    }),
    clearCookie: jest.fn(),
    _cookies: cookies,
  };
};

const mockUser = (overrides = {}) => ({
  _id: { toString: () => 'user-id-123' },
  email: 'user@example.com',
  fullName: 'Test User',
  role: 'customer',
  isActive: true,
  password: 'hashed-pass',
  refreshToken: null,
  shopName: null,
  ...overrides,
});

describe('AuthService — US-AUTH-002 (Refresh & Logout)', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
            findByRefreshTokenHash: jest.fn(),
            updateRefreshToken: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'signed-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: string) => {
              const map: Record<string, string> = {
                JWT_ACCESS_SECRET: 'access-secret',
                JWT_REFRESH_SECRET: 'refresh-secret',
                JWT_ACCESS_EXPIRES_IN: '15m',
                JWT_REFRESH_EXPIRES_IN: '7d',
                NODE_ENV: 'test',
              };
              return map[key] ?? fallback;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  // TC-101: Refresh with valid token → returns new accessToken
  it('TC-101: refresh() with valid hashed refresh token returns new accessToken', async () => {
    const user = mockUser();
    usersService.findByRefreshTokenHash.mockResolvedValue(user as never);
    jwtService.sign.mockReturnValue('new-access-token');

    const result = await service.refresh('valid-refresh-token');

    expect(usersService.findByRefreshTokenHash).toHaveBeenCalled();
    expect(result).toEqual({ accessToken: 'new-access-token' });
  });

  // TC-102: Refresh with invalid/unknown token → 401
  it('TC-102: refresh() with unknown token throws UnauthorizedException', async () => {
    usersService.findByRefreshTokenHash.mockResolvedValue(null);

    await expect(service.refresh('invalid-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // TC-103: Refresh for inactive user → 401 (no active refresh for banned users)
  it('TC-103: refresh() for banned user (isActive=false) throws UnauthorizedException', async () => {
    const user = mockUser({ isActive: false });
    usersService.findByRefreshTokenHash.mockResolvedValue(user as never);

    await expect(service.refresh('some-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // TC-104: Logout clears refreshToken in DB and clears cookie
  it('TC-104: logout() clears refreshToken in DB', async () => {
    usersService.updateRefreshToken.mockResolvedValue(undefined);

    const res = mockResponse();
    await service.logout('user-id-123', res as never);

    expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
      'user-id-123',
      null,
    );
    expect(res.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.objectContaining({ path: '/api/v1/auth' }),
    );
  });
});
