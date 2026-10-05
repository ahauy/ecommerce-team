import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AdminUsersController } from '../admin-users.controller';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

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

describe('AdminUsersController', () => {
  let controller: AdminUsersController;
  let userModel: jest.Mocked<Model<UserDocument>>;
  let productModel: any;

  beforeEach(async () => {
    productModel = {
      updateMany: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 3 }),
      }),
    };

    const mockUserModel = {
      findByIdAndUpdate: jest.fn(),
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
      controllers: [AdminUsersController],
      providers: [
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    controller = module.get<AdminUsersController>(AdminUsersController);
    userModel = module.get(getModelToken(User.name));
    jest.clearAllMocks();
  });

  describe('banUser', () => {
    it('should ban user and block products', async () => {
      const user = mockUser({ isActive: true });
      userModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...user, isActive: false }),
      } as any);

      const result = await controller.banUser('66a1b2c3d4e5f67890123456');

      expect(result).toEqual({
        message: 'Đã khóa tài khoản và chặn gian hàng/sản phẩm',
      });
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '66a1b2c3d4e5f67890123456',
        { isActive: false },
        { new: true, session: expect.anything() },
      );
      expect(productModel.updateMany).toHaveBeenCalledWith(
        {
          sellerId: new Types.ObjectId('66a1b2c3d4e5f67890123456'),
          isBlocked: false,
        },
        { isBlocked: true, blockReason: 'seller_banned' },
        { session: expect.anything() },
      );
    });

    it('should ban user without blocking products if Product model is not registered', async () => {
      const user = mockUser({ isActive: true });
      userModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...user, isActive: false }),
      } as any);

      const savedModels = (userModel.db as any).models;
      (userModel.db as any).models = {};

      const result = await controller.banUser('66a1b2c3d4e5f67890123456');

      expect(result).toEqual({
        message: 'Đã khóa tài khoản và chặn gian hàng/sản phẩm',
      });
      expect(productModel.updateMany).not.toHaveBeenCalled();

      (userModel.db as any).models = savedModels;
    });

    it('should throw NotFoundException when user not found', async () => {
      userModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        controller.banUser('66a1b2c3d4e5f67890123456'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('unbanUser', () => {
    it('should unban user and restore products blocked due to ban', async () => {
      const user = mockUser({ isActive: false });
      userModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...user, isActive: true }),
      } as any);

      const result = await controller.unbanUser('66a1b2c3d4e5f67890123456');

      expect(result).toEqual({
        message: 'Đã mở khóa tài khoản và khôi phục gian hàng/sản phẩm',
      });
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '66a1b2c3d4e5f67890123456',
        { isActive: true },
        { new: true, session: expect.anything() },
      );
      expect(productModel.updateMany).toHaveBeenCalledWith(
        {
          sellerId: new Types.ObjectId('66a1b2c3d4e5f67890123456'),
          blockReason: 'seller_banned',
        },
        { isBlocked: false, blockReason: null },
        { session: expect.anything() },
      );
    });

    it('should unban user without restoring products if Product model is not registered', async () => {
      const user = mockUser({ isActive: false });
      userModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...user, isActive: true }),
      } as any);

      const savedModels = (userModel.db as any).models;
      (userModel.db as any).models = {};

      const result = await controller.unbanUser('66a1b2c3d4e5f67890123456');

      expect(result).toEqual({
        message: 'Đã mở khóa tài khoản và khôi phục gian hàng/sản phẩm',
      });
      expect(productModel.updateMany).not.toHaveBeenCalled();

      (userModel.db as any).models = savedModels;
    });

    it('should throw NotFoundException when user not found', async () => {
      userModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        controller.unbanUser('66a1b2c3d4e5f67890123456'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
