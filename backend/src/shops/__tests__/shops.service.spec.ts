import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { ShopsService } from '../shops.service';
import { User, UserDocument } from '../../users/schemas/user.schema';

const mockUser = (
  overrides: Partial<UserDocument> = {},
): Partial<UserDocument> => ({
  _id: new Types.ObjectId('66a1b2c3d4e5f67890123456'),
  email: 'seller@example.com',
  password: 'hashed',
  fullName: 'Seller User',
  phone: '0901234567',
  address: null,
  role: 'customer',
  isActive: true,
  refreshToken: null,
  shop: {
    shopName: 'Test Shop',
    shopSlug: 'test-shop',
    pickupAddress: '123 Test St',
    phone: '0901234567',
    joinedAt: new Date('2024-01-15T10:30:00.000Z'),
  },
  version: 1,
  ...overrides,
});

describe('ShopsService', () => {
  let service: ShopsService;
  let userModel: jest.Mocked<Model<UserDocument>>;
  let productModel: any;

  beforeEach(async () => {
    productModel = {
      countDocuments: jest.fn().mockResolvedValue(3),
    };

    const mockUserModel = {
      findById: jest.fn(),
      db: {
        models: {
          Product: productModel,
        },
        model: jest.fn().mockReturnValue(productModel),
        startSession: jest.fn().mockResolvedValue({
          startTransaction: jest.fn(),
          commitTransaction: jest.fn(),
          abortTransaction: jest.fn(),
          endSession: jest.fn(),
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopsService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<ShopsService>(ShopsService);
    userModel = module.get(getModelToken(User.name));
  });

  describe('getPublicShop', () => {
    it('should return shop info with product count for active shop', async () => {
      const user = mockUser({ isActive: true });

      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(user),
        }),
      } as any);

      const result = await service.getPublicShop(user._id.toString());

      expect(result).toEqual({
        sellerId: user._id.toString(),
        shopName: 'Test Shop',
        shopSlug: 'test-shop',
        joinedAt: new Date('2024-01-15T10:30:00.000Z'),
        productCount: 3,
      });
    });

    it('should throw NotFoundException when seller is banned', async () => {
      const user = mockUser({ isActive: false });

      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(user),
        }),
      } as any);

      await expect(service.getPublicShop(user._id.toString())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when seller has no shop', async () => {
      const user = mockUser({ shop: null, isActive: true });

      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(user),
        }),
      } as any);

      await expect(service.getPublicShop(user._id.toString())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for invalid ObjectId', async () => {
      await expect(service.getPublicShop('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return correct product count (only active and non-blocked)', async () => {
      const user = mockUser({ isActive: true });
      productModel.countDocuments.mockResolvedValue(5);

      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(user),
        }),
      } as any);

      const result = await service.getPublicShop(user._id.toString());

      expect(result.productCount).toBe(5);
      expect(productModel.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          sellerId: expect.any(Types.ObjectId),
          isActive: true,
          isBlocked: false,
        }),
      );
    });

    it('should return productCount 0 when Product model is not registered', async () => {
      const user = mockUser({ isActive: true });

      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(user),
        }),
      } as any);

      const savedModels = (userModel.db as any).models;
      (userModel.db as any).models = {};

      const result = await service.getPublicShop(user._id.toString());

      expect(result.productCount).toBe(0);
      expect(productModel.countDocuments).not.toHaveBeenCalled();

      (userModel.db as any).models = savedModels;
    });
  });
});
