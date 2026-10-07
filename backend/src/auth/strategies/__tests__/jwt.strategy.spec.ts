import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { JwtStrategy, JwtPayload } from '../jwt.strategy';
import { UsersService } from '../../../users/users.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: jest.Mocked<Partial<UsersService>>;

  const mockUser = {
    _id: new Types.ObjectId('66a1b2c3d4e5f67890123456'),
    email: 'user@example.com',
    role: 'customer',
    isActive: true,
  };

  beforeEach(async () => {
    usersService = {
      findById: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  const payload: JwtPayload = {
    sub: '66a1b2c3d4e5f67890123456',
    email: 'user@example.com',
    role: 'customer',
  };

  it.each([
    [{ shopName: 'Shop A', pickupAddress: '123 Đường ABC, Quận 1' }, true],
    [{ shopName: 'Shop A', pickupAddress: null }, false],
    [{ shopName: null, pickupAddress: null }, false],
    [null, false],
  ])(
    'hasShop phản ánh việc đã thiết lập gian hàng (%o)',
    async (shop, expected) => {
      (usersService.findById as jest.Mock).mockResolvedValue({
        ...mockUser,
        shop,
      });

      const result = await strategy.validate(payload);

      expect(result.hasShop).toBe(expected);
    },
  );

  it('should validate and return user payload including isActive', async () => {
    (usersService.findById as jest.Mock).mockResolvedValue(mockUser);

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      id: '66a1b2c3d4e5f67890123456',
      email: 'user@example.com',
      role: 'customer',
      isActive: true,
      hasShop: false,
    });
    expect(usersService.findById).toHaveBeenCalledWith(
      '66a1b2c3d4e5f67890123456',
    );
  });

  it('should throw UnauthorizedException if user is not found', async () => {
    (usersService.findById as jest.Mock).mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw ForbiddenException if user isActive is false', async () => {
    (usersService.findById as jest.Mock).mockResolvedValue({
      ...mockUser,
      isActive: false,
    });

    await expect(strategy.validate(payload)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
