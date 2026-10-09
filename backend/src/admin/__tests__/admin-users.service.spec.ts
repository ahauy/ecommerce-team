import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Product } from '../../products/schemas/product.schema';
import { User, UserRole } from '../../users/schemas/user.schema';
import {
  AdminUsersService,
  CANNOT_BAN_SELF,
  SELLER_BANNED_REASON,
  USER_NOT_FOUND,
} from '../admin-users.service';
import { AdminUsersQueryDto } from '../dto/admin-users-query.dto';
import { escapeRegex } from '../../common/utils/escape-regex';

const ADMIN_ID = new Types.ObjectId().toString();
const SELLER = new Types.ObjectId();
const BUYER = new Types.ObjectId();

const chain = <T>(value: T) => {
  const q: Record<string, jest.Mock> = {};
  ['select', 'sort', 'skip', 'limit', 'lean'].forEach((m) => {
    q[m] = jest.fn().mockReturnValue(q);
  });
  q.exec = jest.fn().mockResolvedValue(value);
  return q;
};

const query = (overrides: Partial<AdminUsersQueryDto> = {}) =>
  Object.assign(new AdminUsersQueryDto(), overrides);

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  const session = {
    withTransaction: jest.fn(async (work: () => Promise<void>) => {
      await work();
    }),
    endSession: jest.fn().mockResolvedValue(undefined),
  };
  const userModel = {
    find: jest.fn(),
    countDocuments: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    db: { startSession: jest.fn().mockResolvedValue(session) },
  };
  const productModel = { updateMany: jest.fn(), aggregate: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    productModel.updateMany.mockReturnValue(chain({ modifiedCount: 3 }));
    productModel.aggregate.mockReturnValue(chain([]));

    const module = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Product.name), useValue: productModel },
      ],
    }).compile();
    service = module.get(AdminUsersService);
  });

  describe('list', () => {
    const seller = {
      _id: SELLER,
      email: 'seller@example.com',
      fullName: 'Người Bán',
      phone: '0901234567',
      role: UserRole.CUSTOMER,
      isActive: true,
      shop: { shopName: 'Shop A', shopSlug: 'shop-a' },
      createdAt: new Date('2026-10-01T00:00:00.000Z'),
    };
    const buyer = {
      _id: BUYER,
      email: 'buyer@example.com',
      fullName: 'Người Mua',
      role: UserRole.CUSTOMER,
      isActive: false,
      shop: { shopName: null, shopSlug: null },
      createdAt: new Date('2026-10-02T00:00:00.000Z'),
    };

    it('phân trang, mới nhất trước, không lấy password/refreshToken, đếm SP bằng 1 aggregate', async () => {
      const q = chain([seller, buyer]);
      userModel.find.mockReturnValue(q);
      userModel.countDocuments.mockReturnValue(chain(45));
      productModel.aggregate.mockReturnValue(
        chain([{ _id: SELLER, count: 7 }]),
      );

      const result = await service.list(query({ page: 2, limit: 20 }));

      expect(userModel.find).toHaveBeenCalledWith({});
      expect(q.select).toHaveBeenCalledWith(
        'email fullName phone role isActive shop createdAt',
      );
      expect(q.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
      expect(q.skip).toHaveBeenCalledWith(20);
      expect(productModel.aggregate).toHaveBeenCalledTimes(1);
      expect(productModel.aggregate.mock.calls[0][0][0]).toEqual({
        $match: { sellerId: { $in: [SELLER, BUYER] } },
      });
      expect(result).toMatchObject({
        total: 45,
        page: 2,
        limit: 20,
        totalPages: 3,
      });
      expect(result.items).toEqual([
        {
          id: SELLER.toString(),
          email: 'seller@example.com',
          fullName: 'Người Bán',
          phone: '0901234567',
          role: UserRole.CUSTOMER,
          isActive: true,
          shop: { shopName: 'Shop A', shopSlug: 'shop-a' },
          productCount: 7,
          createdAt: '2026-10-01T00:00:00.000Z',
        },
        expect.objectContaining({
          id: BUYER.toString(),
          phone: null,
          isActive: false,
          shop: null,
          productCount: 0,
        }),
      ]);
    });

    it('lọc role, isActive=false và tìm theo email / họ tên / tên shop', async () => {
      userModel.find.mockReturnValue(chain([]));
      userModel.countDocuments.mockReturnValue(chain(0));

      await service.list(
        query({ role: UserRole.CUSTOMER, isActive: false, search: 'shop a' }),
      );

      const filter = userModel.find.mock.calls[0][0];
      expect(filter.role).toBe(UserRole.CUSTOMER);
      expect(filter.isActive).toBe(false);
      expect(filter.$or).toEqual([
        { email: /shop a/i },
        { fullName: /shop a/i },
        { 'shop.shopName': /shop a/i },
      ]);
      expect(productModel.aggregate).not.toHaveBeenCalled();
    });

    it('từ khóa có ký tự đặc biệt của regex được escape', async () => {
      userModel.find.mockReturnValue(chain([]));
      userModel.countDocuments.mockReturnValue(chain(0));

      await service.list(query({ search: 'a.b*(c' }));

      const pattern: RegExp = userModel.find.mock.calls[0][0].$or[0].email;
      expect(pattern.test('a.b*(c')).toBe(true);
      expect(pattern.test('axbbbc')).toBe(false);
      expect(escapeRegex('(.*)')).toBe('\\(\\.\\*\\)');
    });
  });

  describe('ban', () => {
    it('tự khóa chính mình → 400, không đụng DB', async () => {
      await expect(service.ban(ADMIN_ID, ADMIN_ID)).rejects.toThrow(
        new BadRequestException(CANNOT_BAN_SELF),
      );
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('khóa user và block mọi SP chưa bị block trong cùng transaction', async () => {
      userModel.findByIdAndUpdate.mockReturnValue(chain({ _id: SELLER }));

      await expect(service.ban(ADMIN_ID, SELLER.toString())).resolves.toEqual({
        message: 'Đã khóa tài khoản và chặn gian hàng/sản phẩm',
      });

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        SELLER.toString(),
        { isActive: false },
        expect.objectContaining({ session }),
      );
      expect(productModel.updateMany).toHaveBeenCalledWith(
        { sellerId: SELLER, isBlocked: false },
        { isBlocked: true, blockReason: SELLER_BANNED_REASON },
        { session },
      );
      expect(session.endSession).toHaveBeenCalled();
    });

    it('user không tồn tại → 404, không block SP', async () => {
      userModel.findByIdAndUpdate.mockReturnValue(chain(null));

      await expect(service.ban(ADMIN_ID, SELLER.toString())).rejects.toThrow(
        new NotFoundException(USER_NOT_FOUND),
      );
      expect(productModel.updateMany).not.toHaveBeenCalled();
      expect(session.endSession).toHaveBeenCalled();
    });
  });

  describe('unban', () => {
    it('mở khóa user và chỉ mở lại SP bị block do ban', async () => {
      userModel.findByIdAndUpdate.mockReturnValue(chain({ _id: SELLER }));

      await service.unban(SELLER.toString());

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        SELLER.toString(),
        { isActive: true },
        expect.objectContaining({ session }),
      );
      expect(productModel.updateMany).toHaveBeenCalledWith(
        { sellerId: SELLER, blockReason: SELLER_BANNED_REASON },
        { isBlocked: false, blockReason: null },
        { session },
      );
    });

    it('user không tồn tại → 404', async () => {
      userModel.findByIdAndUpdate.mockReturnValue(chain(null));

      await expect(service.unban(SELLER.toString())).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
