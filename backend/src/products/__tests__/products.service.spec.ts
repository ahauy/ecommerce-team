import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ProductsService, AuthUser } from '../products.service';
import { Product } from '../schemas/product.schema';
import { Category } from '../../categories/schemas/category.schema';
import { User, UserRole } from '../../users/schemas/user.schema';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';

const OWNER_ID = new Types.ObjectId().toString();
const OTHER_ID = new Types.ObjectId().toString();
const CATEGORY_ID = new Types.ObjectId().toString();
const PRODUCT_ID = new Types.ObjectId();
const CLOUD_URL = 'https://res.cloudinary.com/demo/image/upload/a.jpg';

const owner: AuthUser = { id: OWNER_ID, role: UserRole.CUSTOMER };
const stranger: AuthUser = { id: OTHER_ID, role: UserRole.CUSTOMER };
const admin: AuthUser = { id: OTHER_ID, role: UserRole.ADMIN };

const chain = <T>(value: T) => {
  const q: Record<string, jest.Mock> = {};
  ['select', 'sort', 'skip', 'limit', 'lean'].forEach((m) => {
    q[m] = jest.fn().mockReturnValue(q);
  });
  q.exec = jest.fn().mockResolvedValue(value);
  return q;
};

const makeProduct = (overrides: Record<string, unknown> = {}) => {
  const doc: Record<string, unknown> = {
    _id: PRODUCT_ID,
    sellerId: new Types.ObjectId(OWNER_ID),
    name: 'iPhone 15 Pro',
    slug: 'iphone-15-pro-abc123',
    description: 'Mô tả',
    price: 100000,
    stock: 5,
    images: [CLOUD_URL],
    categoryId: new Types.ObjectId(CATEGORY_ID),
    isActive: true,
    isBlocked: false,
    blockReason: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
  doc.save = jest.fn().mockResolvedValue(doc);
  return doc;
};

const query = (overrides: Partial<ListProductsQueryDto> = {}) =>
  Object.assign(new ListProductsQueryDto(), overrides);

describe('ProductsService', () => {
  let service: ProductsService;
  const productModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
  };
  const categoryModel = { findOne: jest.fn(), findById: jest.fn() };
  const userModel = { findById: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getModelToken(Product.name), useValue: productModel },
        { provide: getModelToken(Category.name), useValue: categoryModel },
        { provide: getModelToken(User.name), useValue: userModel },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('demo') },
        },
      ],
    }).compile();
    service = module.get(ProductsService);
  });

  describe('create', () => {
    const dto = {
      name: 'iPhone 15 Pro',
      description: 'Mô tả',
      price: 100000,
      stock: 5,
      categoryId: CATEGORY_ID,
      images: [CLOUD_URL],
    };

    const categoryReady = () =>
      categoryModel.findOne.mockReturnValue(chain({ _id: CATEGORY_ID }));

    it('trả 400 khi ảnh không thuộc Cloudinary của hệ thống', async () => {
      await expect(
        service.create(owner, { ...dto, images: ['https://evil.com/a.jpg'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('trả 400 khi danh mục không tồn tại hoặc bị ẩn', async () => {
      categoryModel.findOne.mockReturnValue(chain(null));

      await expect(service.create(owner, dto)).rejects.toThrow(
        new BadRequestException('Danh mục không tồn tại hoặc đã bị ẩn'),
      );
    });

    it('gán sellerId từ token và sinh slug có hậu tố ngẫu nhiên', async () => {
      categoryReady();
      productModel.create.mockImplementation((data) =>
        Promise.resolve(makeProduct(data)),
      );

      const result = await service.create(owner, dto);

      const saved = productModel.create.mock.calls[0][0];
      expect(saved.sellerId.toString()).toBe(OWNER_ID);
      expect(saved.slug).toMatch(/^iphone-15-pro-[0-9a-f]{6}$/);
      expect(result.sellerId).toBe(OWNER_ID);
    });

    it('thử lại khi slug bị trùng (11000)', async () => {
      categoryReady();
      productModel.create
        .mockRejectedValueOnce({ code: 11000 })
        .mockImplementationOnce((data) => Promise.resolve(makeProduct(data)));

      await service.create(owner, dto);

      expect(productModel.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('findPublic', () => {
    beforeEach(() => {
      productModel.find.mockReturnValue(chain([makeProduct()]));
      productModel.countDocuments.mockReturnValue(chain(45));
    });

    it('chỉ lọc SP đang hiển thị và trả về thông tin phân trang', async () => {
      const result = await service.findPublic(query({ limit: 20 }));

      const filter = productModel.find.mock.calls[0][0];
      expect(filter).toMatchObject({ isActive: true, isBlocked: false });
      expect(result).toMatchObject({
        total: 45,
        page: 1,
        limit: 20,
        totalPages: 3,
      });
      expect(result.items[0]).not.toHaveProperty('isBlocked');
    });

    it('áp dụng search, categoryId, sellerId và khoảng giá', async () => {
      await service.findPublic(
        query({
          search: 'iphone',
          categoryId: CATEGORY_ID,
          sellerId: OWNER_ID,
          minPrice: 100,
          maxPrice: 500,
        }),
      );

      const filter = productModel.find.mock.calls[0][0];
      expect(filter.$text).toEqual({ $search: 'iphone' });
      expect(filter.categoryId.toString()).toBe(CATEGORY_ID);
      expect(filter.sellerId.toString()).toBe(OWNER_ID);
      expect(filter.price).toEqual({ $gte: 100, $lte: 500 });
    });

    it('trả 400 khi minPrice lớn hơn maxPrice', async () => {
      await expect(
        service.findPublic(query({ minPrice: 500, maxPrice: 100 })),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('khách xem SP đang hiển thị: không lộ isBlocked/blockReason', async () => {
      productModel.findById.mockReturnValue(chain(makeProduct()));
      categoryModel.findById.mockReturnValue(
        chain({ _id: new Types.ObjectId(CATEGORY_ID), name: 'Điện thoại' }),
      );
      userModel.findById.mockReturnValue(
        chain({ shop: { shopName: 'Shop A' } }),
      );

      const result = await service.findOne(PRODUCT_ID.toString(), null);

      expect(result.category).toEqual({
        id: CATEGORY_ID,
        name: 'Điện thoại',
      });
      expect(result.seller.shopName).toBe('Shop A');
      expect(result).not.toHaveProperty('isBlocked');
      expect(result).not.toHaveProperty('blockReason');
    });

    it('SP bị block: khách nhận 404', async () => {
      productModel.findById.mockReturnValue(
        chain(makeProduct({ isBlocked: true, blockReason: 'vi phạm' })),
      );

      await expect(
        service.findOne(PRODUCT_ID.toString(), stranger),
      ).rejects.toThrow(new NotFoundException('Không tìm thấy sản phẩm'));
    });

    it('SP bị ẩn/block: chủ SP và Admin vẫn xem được kèm blockReason', async () => {
      const hidden = makeProduct({
        isActive: false,
        isBlocked: true,
        blockReason: 'vi phạm',
      });
      productModel.findById.mockReturnValue(chain(hidden));
      categoryModel.findById.mockReturnValue(chain(null));
      userModel.findById.mockReturnValue(chain(null));

      const asOwner = await service.findOne(PRODUCT_ID.toString(), owner);
      const asAdmin = await service.findOne(PRODUCT_ID.toString(), admin);

      expect(asOwner.blockReason).toBe('vi phạm');
      expect(asAdmin.isBlocked).toBe(true);
    });

    it('không tồn tại: 404', async () => {
      productModel.findById.mockReturnValue(chain(null));

      await expect(
        service.findOne(PRODUCT_ID.toString(), owner),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('người khác sửa: 403', async () => {
      productModel.findById.mockReturnValue(chain(makeProduct()));

      await expect(
        service.update(PRODUCT_ID.toString(), stranger, { price: 1 }),
      ).rejects.toThrow(
        new ForbiddenException('Bạn không có quyền thao tác trên sản phẩm này'),
      );
    });

    it('chủ SP sửa giá/tồn kho và giữ nguyên slug, sellerId', async () => {
      const product = makeProduct();
      productModel.findById.mockReturnValue(chain(product));

      const result = await service.update(PRODUCT_ID.toString(), owner, {
        price: 250000,
        stock: 0,
      });

      expect(product.save).toHaveBeenCalled();
      expect(result.price).toBe(250000);
      expect(result.stock).toBe(0);
      expect(result.slug).toBe('iphone-15-pro-abc123');
      expect(result.sellerId).toBe(OWNER_ID);
    });

    it('Admin sửa được SP của người khác', async () => {
      productModel.findById.mockReturnValue(chain(makeProduct()));

      const result = await service.update(PRODUCT_ID.toString(), admin, {
        name: 'Tên mới',
      });

      expect(result.name).toBe('Tên mới');
    });

    it('không cho bật lại SP đang bị block: 403', async () => {
      productModel.findById.mockReturnValue(
        chain(makeProduct({ isActive: false, isBlocked: true })),
      );

      await expect(
        service.update(PRODUCT_ID.toString(), owner, { isActive: true }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('đổi sang danh mục không hợp lệ: 400', async () => {
      productModel.findById.mockReturnValue(chain(makeProduct()));
      categoryModel.findOne.mockReturnValue(chain(null));

      await expect(
        service.update(PRODUCT_ID.toString(), owner, {
          categoryId: new Types.ObjectId().toString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('SP không tồn tại: 404', async () => {
      productModel.findById.mockReturnValue(chain(null));

      await expect(
        service.update(PRODUCT_ID.toString(), owner, { price: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft delete: đặt isActive = false', async () => {
      const product = makeProduct();
      productModel.findById.mockReturnValue(chain(product));

      const result = await service.remove(PRODUCT_ID.toString(), owner);

      expect(product.isActive).toBe(false);
      expect(product.save).toHaveBeenCalled();
      expect(result).toEqual({ id: PRODUCT_ID.toString(), isActive: false });
    });

    it('người khác xóa: 403', async () => {
      productModel.findById.mockReturnValue(chain(makeProduct()));

      await expect(
        service.remove(PRODUCT_ID.toString(), stranger),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findMine', () => {
    it('chỉ lọc theo sellerId của mình, gồm cả SP ẩn/bị block', async () => {
      productModel.find.mockReturnValue(
        chain([makeProduct({ isBlocked: true, blockReason: 'vi phạm' })]),
      );
      productModel.countDocuments.mockReturnValue(chain(1));

      const result = await service.findMine(owner, { page: 1, limit: 20 });

      const filter = productModel.find.mock.calls[0][0];
      expect(filter.sellerId.toString()).toBe(OWNER_ID);
      expect(filter).not.toHaveProperty('isActive');
      expect(result.items[0].blockReason).toBe('vi phạm');
    });
  });
});
