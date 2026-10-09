import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Category } from '../../categories/schemas/category.schema';
import { Product } from '../../products/schemas/product.schema';
import { User } from '../../users/schemas/user.schema';
import {
  ALREADY_BLOCKED,
  AdminProductsService,
  NOT_BLOCKED,
  PRODUCT_NOT_FOUND,
  RESERVED_REASON,
  SELLER_STILL_BANNED,
} from '../admin-products.service';
import { SELLER_BANNED_REASON } from '../admin-users.service';
import { AdminProductsQueryDto } from '../dto/admin-products-query.dto';

const PRODUCT_ID = new Types.ObjectId();
const SELLER_ID = new Types.ObjectId();
const CATEGORY_ID = new Types.ObjectId();

const chain = <T>(value: T) => {
  const q: Record<string, jest.Mock> = {};
  ['select', 'sort', 'skip', 'limit', 'lean'].forEach((m) => {
    q[m] = jest.fn().mockReturnValue(q);
  });
  q.exec = jest.fn().mockResolvedValue(value);
  return q;
};

const makeProduct = (overrides: Record<string, unknown> = {}) => ({
  _id: PRODUCT_ID,
  name: 'Áo thun',
  slug: 'ao-thun-abc123',
  price: 100000,
  stock: 5,
  images: ['https://res.cloudinary.com/demo/a.jpg'],
  isActive: true,
  isBlocked: false,
  blockReason: null,
  categoryId: CATEGORY_ID,
  sellerId: SELLER_ID,
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  ...overrides,
});

const query = (overrides: Partial<AdminProductsQueryDto> = {}) =>
  Object.assign(new AdminProductsQueryDto(), overrides);

describe('AdminProductsService', () => {
  let service: AdminProductsService;
  const productModel = {
    find: jest.fn(),
    countDocuments: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findById: jest.fn(),
    exists: jest.fn(),
  };
  const categoryModel = { find: jest.fn() };
  const userModel = { find: jest.fn(), findById: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    categoryModel.find.mockReturnValue(
      chain([{ _id: CATEGORY_ID, name: 'Thời trang' }]),
    );
    userModel.find.mockReturnValue(
      chain([
        {
          _id: SELLER_ID,
          fullName: 'Người Bán',
          email: 'seller@example.com',
          isActive: true,
          shop: { shopName: 'Shop A' },
        },
      ]),
    );

    const module = await Test.createTestingModule({
      providers: [
        AdminProductsService,
        { provide: getModelToken(Product.name), useValue: productModel },
        { provide: getModelToken(Category.name), useValue: categoryModel },
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();
    service = module.get(AdminProductsService);
  });

  describe('list', () => {
    it('lấy mọi SP (kể cả ẩn / bị chặn), kèm danh mục và người bán', async () => {
      const q = chain([makeProduct({ isActive: false })]);
      productModel.find.mockReturnValue(q);
      productModel.countDocuments.mockReturnValue(chain(41));

      const result = await service.list(query({ page: 3 }));

      expect(productModel.find).toHaveBeenCalledWith({});
      expect(q.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
      expect(q.skip).toHaveBeenCalledWith(40);
      expect(result).toMatchObject({
        total: 41,
        page: 3,
        limit: 20,
        totalPages: 3,
      });
      expect(result.items[0]).toEqual({
        id: PRODUCT_ID.toString(),
        name: 'Áo thun',
        slug: 'ao-thun-abc123',
        price: 100000,
        stock: 5,
        imageUrl: 'https://res.cloudinary.com/demo/a.jpg',
        isActive: false,
        isBlocked: false,
        blockReason: null,
        category: { id: CATEGORY_ID.toString(), name: 'Thời trang' },
        seller: {
          id: SELLER_ID.toString(),
          fullName: 'Người Bán',
          email: 'seller@example.com',
          shopName: 'Shop A',
          isActive: true,
        },
        createdAt: '2026-10-01T00:00:00.000Z',
      });
    });

    it('lọc isBlocked, sellerId và tìm theo tên (escape regex)', async () => {
      productModel.find.mockReturnValue(chain([]));
      productModel.countDocuments.mockReturnValue(chain(0));

      const result = await service.list(
        query({
          isBlocked: true,
          sellerId: SELLER_ID.toString(),
          search: 'áo (size',
        }),
      );

      const filter = productModel.find.mock.calls[0][0];
      expect(filter.isBlocked).toBe(true);
      expect(filter.sellerId).toEqual(SELLER_ID);
      expect(filter.name.test('Áo (size L)')).toBe(true);
      expect(result.items).toEqual([]);
      expect(categoryModel.find).not.toHaveBeenCalled();
    });
  });

  describe('block', () => {
    it('chặn SP chưa bị chặn, lưu lý do', async () => {
      productModel.findOneAndUpdate.mockReturnValue(
        chain(makeProduct({ isBlocked: true, blockReason: 'Hàng giả' })),
      );

      const dto = await service.block(PRODUCT_ID.toString(), 'Hàng giả');

      expect(productModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: PRODUCT_ID, isBlocked: false },
        { $set: { isBlocked: true, blockReason: 'Hàng giả' } },
        { returnDocument: 'after' },
      );
      expect(dto).toMatchObject({ isBlocked: true, blockReason: 'Hàng giả' });
    });

    it('SP đã bị chặn → 400', async () => {
      productModel.findOneAndUpdate.mockReturnValue(chain(null));
      productModel.exists.mockReturnValue(chain({ _id: PRODUCT_ID }));

      await expect(
        service.block(PRODUCT_ID.toString(), 'Hàng giả'),
      ).rejects.toThrow(new BadRequestException(ALREADY_BLOCKED));
    });

    it('SP không tồn tại → 404', async () => {
      productModel.findOneAndUpdate.mockReturnValue(chain(null));
      productModel.exists.mockReturnValue(chain(null));

      await expect(
        service.block(PRODUCT_ID.toString(), 'Hàng giả'),
      ).rejects.toThrow(new NotFoundException(PRODUCT_NOT_FOUND));
    });

    it('không cho dùng lý do dành riêng "seller_banned"', async () => {
      await expect(
        service.block(PRODUCT_ID.toString(), SELLER_BANNED_REASON),
      ).rejects.toThrow(new BadRequestException(RESERVED_REASON));
      expect(productModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('unblock', () => {
    it('mở chặn SP bị chặn vì vi phạm', async () => {
      productModel.findById.mockReturnValue(
        chain({
          isBlocked: true,
          blockReason: 'Hàng giả',
          sellerId: SELLER_ID,
        }),
      );
      productModel.findOneAndUpdate.mockReturnValue(chain(makeProduct()));

      const dto = await service.unblock(PRODUCT_ID.toString());

      expect(productModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: PRODUCT_ID, isBlocked: true },
        { $set: { isBlocked: false, blockReason: null } },
        { returnDocument: 'after' },
      );
      expect(dto.isBlocked).toBe(false);
      expect(userModel.findById).not.toHaveBeenCalled();
    });

    it('SP bị chặn do người bán bị khóa mà người bán vẫn đang khóa → 400', async () => {
      productModel.findById.mockReturnValue(
        chain({
          isBlocked: true,
          blockReason: SELLER_BANNED_REASON,
          sellerId: SELLER_ID,
        }),
      );
      userModel.findById.mockReturnValue(chain({ isActive: false }));

      await expect(service.unblock(PRODUCT_ID.toString())).rejects.toThrow(
        new BadRequestException(SELLER_STILL_BANNED),
      );
      expect(productModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('SP bị chặn do khóa người bán nhưng người bán đã mở khóa → cho mở', async () => {
      productModel.findById.mockReturnValue(
        chain({
          isBlocked: true,
          blockReason: SELLER_BANNED_REASON,
          sellerId: SELLER_ID,
        }),
      );
      userModel.findById.mockReturnValue(chain({ isActive: true }));
      productModel.findOneAndUpdate.mockReturnValue(chain(makeProduct()));

      await expect(
        service.unblock(PRODUCT_ID.toString()),
      ).resolves.toMatchObject({
        isBlocked: false,
      });
    });

    it('SP không bị chặn → 400, không tồn tại → 404', async () => {
      productModel.findById.mockReturnValueOnce(chain({ isBlocked: false }));
      await expect(service.unblock(PRODUCT_ID.toString())).rejects.toThrow(
        new BadRequestException(NOT_BLOCKED),
      );

      productModel.findById.mockReturnValueOnce(chain(null));
      await expect(service.unblock(PRODUCT_ID.toString())).rejects.toThrow(
        new NotFoundException(PRODUCT_NOT_FOUND),
      );
    });
  });
});
