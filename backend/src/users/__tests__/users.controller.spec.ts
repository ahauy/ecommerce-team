import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { GetProfileResponseDto } from '../dto/get-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { SetupShopDto } from '../dto/setup-shop.dto';

const mockUsersService = {
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  setupShop: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;
  let service: typeof mockUsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
    jest.clearAllMocks();
  });

  const mockRequest = (userId: string) => ({ user: { id: userId } });

  describe('getProfile', () => {
    it('should return profile when user has shop', async () => {
      const expected: GetProfileResponseDto = {
        id: '66a1b2c3d4e5f67890123456',
        email: 'test@example.com',
        fullName: 'Test User',
        phone: '0901234567',
        address: '123 Test St',
        role: 'customer',
        isActive: true,
        version: 1,
        shop: {
          shopName: 'Test Shop',
          shopSlug: 'test-shop',
          pickupAddress: '123 Test St',
          joinedAt: new Date('2024-01-15T10:30:00.000Z'),
        },
      };

      service.getProfile.mockResolvedValue(expected);

      const result = await controller.getProfile(
        mockRequest('66a1b2c3d4e5f67890123456'),
      );

      expect(result).toEqual(expected);
      expect(service.getProfile).toHaveBeenCalledWith(
        '66a1b2c3d4e5f67890123456',
      );
    });

    it('should return profile with shop: null when no shop', async () => {
      const expected: GetProfileResponseDto = {
        id: '66a1b2c3d4e5f67890123456',
        email: 'test@example.com',
        fullName: 'Test User',
        phone: null,
        address: null,
        role: 'customer',
        isActive: true,
        version: 0,
        shop: null,
      };

      service.getProfile.mockResolvedValue(expected);

      const result = await controller.getProfile(
        mockRequest('66a1b2c3d4e5f67890123456'),
      );

      expect(result.shop).toBeNull();
    });

    it('should throw NotFoundException when user not found', async () => {
      service.getProfile.mockRejectedValue(new NotFoundException());

      await expect(
        controller.getProfile(mockRequest('66a1b2c3d4e5f67890123456')),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update profile and return updated', async () => {
      const dto: UpdateProfileDto = {
        fullName: 'New Name',
        phone: '0987654321',
      };
      const expected: GetProfileResponseDto = {
        id: '66a1b2c3d4e5f67890123456',
        email: 'test@example.com',
        fullName: 'New Name',
        phone: '0987654321',
        address: 'Old Address',
        role: 'customer',
        isActive: true,
        version: 2,
        shop: null,
      };

      service.updateProfile.mockResolvedValue(expected);

      const result = await controller.updateProfile(
        mockRequest('66a1b2c3d4e5f67890123456'),
        dto,
      );

      expect(result).toEqual(expected);
      expect(service.updateProfile).toHaveBeenCalledWith(
        '66a1b2c3d4e5f67890123456',
        dto,
      );
    });

    it('should throw ConflictException on version mismatch', async () => {
      service.updateProfile.mockRejectedValue(new ConflictException());

      await expect(
        controller.updateProfile(mockRequest('66a1b2c3d4e5f67890123456'), {
          fullName: 'New',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('setupShop', () => {
    it('should setup shop and return profile with shop', async () => {
      const dto: SetupShopDto = {
        shopName: 'My Shop',
        pickupAddress: '123 Test St',
        phone: '0901234567',
      };
      const expected: GetProfileResponseDto = {
        id: '66a1b2c3d4e5f67890123456',
        email: 'test@example.com',
        fullName: 'Test User',
        phone: '0901234567',
        address: null,
        role: 'customer',
        isActive: true,
        version: 2,
        shop: {
          shopName: 'My Shop',
          shopSlug: 'my-shop',
          pickupAddress: '123 Test St',
          joinedAt: new Date(),
        },
      };

      service.setupShop.mockResolvedValue(expected);

      const result = await controller.setupShop(
        mockRequest('66a1b2c3d4e5f67890123456'),
        dto,
      );

      expect(result.shop?.shopName).toBe('My Shop');
      expect(service.setupShop).toHaveBeenCalledWith(
        '66a1b2c3d4e5f67890123456',
        dto,
      );
    });

    it('should throw ConflictException on version mismatch', async () => {
      service.setupShop.mockRejectedValue(new ConflictException());

      await expect(
        controller.setupShop(mockRequest('66a1b2c3d4e5f67890123456'), {
          shopName: 'Test',
          pickupAddress: '1234567890',
          phone: '0901234567',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
