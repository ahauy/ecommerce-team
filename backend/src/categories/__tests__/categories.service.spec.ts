import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesService } from '../categories.service';
import { Category } from '../schemas/category.schema';
import { CreateCategoryDto } from '../dto/create-category.dto';
import {
  createMockModels,
  queryResult,
  collationResult,
  execResult,
  leanResult,
} from './categories-test.helper';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let mockCategoryModel: ReturnType<
    typeof createMockModels
  >['mockCategoryModel'];
  let mockProductModel: ReturnType<typeof createMockModels>['mockProductModel'];
  let mockConnection: ReturnType<typeof createMockModels>['mockConnection'];

  beforeEach(async () => {
    const mocks = createMockModels();
    mockProductModel = mocks.mockProductModel;
    mockConnection = mocks.mockConnection;
    mockCategoryModel = mocks.mockCategoryModel;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getModelToken(Category.name), useValue: mockCategoryModel },
        { provide: getConnectionToken(), useValue: mockConnection },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findActive', () => {
    it('should return only active categories sorted by name with Vietnamese collation', async () => {
      const active = [
        {
          _id: 'cat-1',
          name: 'Đồ Gia Dụng',
          slug: 'do-gia-dung',
          isActive: true,
        },
        {
          _id: 'cat-2',
          name: 'Thời Trang',
          slug: 'thoi-trang',
          isActive: true,
        },
      ];
      const mockChain = queryResult(active);
      mockCategoryModel.find.mockReturnValue(mockChain);

      const result = await service.findActive();
      expect(mockCategoryModel.find).toHaveBeenCalledWith({ isActive: true });
      expect(mockChain.sort).toHaveBeenCalledWith({ name: 1 });
      expect(mockChain.collation).toHaveBeenCalledWith({ locale: 'vi' });
      expect(result).toEqual(active);
    });

    it('should return an empty array if no active categories exist', async () => {
      mockCategoryModel.find.mockReturnValue(queryResult([]));
      expect(await service.findActive()).toEqual([]);
    });
  });

  describe('findBySlug', () => {
    it('should return category when found by slug', async () => {
      const cat = {
        _id: 'cat-1',
        name: 'Thời Trang',
        slug: 'thoi-trang',
        isActive: true,
      };
      mockCategoryModel.findOne.mockReturnValue(leanResult(cat));

      expect(await service.findBySlug('thoi-trang')).toEqual(cat);
      expect(mockCategoryModel.findOne).toHaveBeenCalledWith({
        slug: 'thoi-trang',
        isActive: true,
      });
    });

    it('should throw NotFoundException when category slug does not exist', async () => {
      mockCategoryModel.findOne.mockReturnValue(leanResult(null));
      await expect(service.findBySlug('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should auto-generate slug from name and save category (TC-CAT-003)', async () => {
      const dto: CreateCategoryDto = {
        name: 'Đồ Gia Dụng',
        description: 'Vật dụng gia đình',
        isActive: true,
      };
      mockCategoryModel.findOne
        .mockReturnValueOnce(collationResult(null))
        .mockReturnValueOnce(execResult(null));
      mockCategoryModel.create.mockImplementation(
        (doc: Record<string, unknown>) => ({ ...doc, _id: 'cat-id-1' }),
      );

      const result = await service.create(dto);
      expect(result.slug).toBe('do-gia-dung');
      expect(result.name).toBe('Đồ Gia Dụng');
    });

    it('should append index suffix if slug collision occurs', async () => {
      mockCategoryModel.findOne
        .mockReturnValueOnce(collationResult(null))
        .mockReturnValueOnce(execResult({ _id: 'cat-0', slug: 'do-gia-dung' }))
        .mockReturnValueOnce(execResult(null));
      mockCategoryModel.create.mockImplementation(
        (doc: Record<string, unknown>) => ({ ...doc, _id: 'cat-id-2' }),
      );

      const result = await service.create({ name: 'Đồ Gia Dụng' });
      expect(result.slug).toBe('do-gia-dung-1');
    });

    it('should throw ConflictException when category name exists (TC-CAT-004)', async () => {
      mockCategoryModel.findOne.mockReturnValue(
        collationResult({ _id: 'cat-1', name: 'Thời Trang' }),
      );
      await expect(service.create({ name: 'thời trang' })).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create({ name: 'thời trang' })).rejects.toThrow(
        'Tên danh mục đã tồn tại',
      );
    });

    it('should throw ConflictException when mongo throws 11000 duplicate key error', async () => {
      mockCategoryModel.findOne
        .mockReturnValueOnce(collationResult(null))
        .mockReturnValueOnce(execResult(null));
      const err = new Error('Duplicate key');
      Object.assign(err, { code: 11000 });
      mockCategoryModel.create.mockRejectedValue(err);

      await expect(service.create({ name: 'Thời Trang' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAllAdmin', () => {
    it('should return all categories with product counts (TC-CAT-002)', async () => {
      const cats = [
        {
          _id: 'cat-1',
          name: 'Đồ Gia Dụng',
          slug: 'do-gia-dung',
          isActive: true,
        },
        {
          _id: 'cat-2',
          name: 'Ẩn Danh Mục',
          slug: 'an-danh-muc',
          isActive: false,
        },
      ];
      mockCategoryModel.find.mockReturnValue(queryResult(cats));
      mockProductModel.countDocuments
        .mockReturnValueOnce(execResult(10))
        .mockReturnValueOnce(execResult(0));

      const result = await service.findAllAdmin();
      expect(result).toHaveLength(2);
      expect(result[0].productCount).toBe(10);
      expect(result[1].productCount).toBe(0);
    });

    it('should return productCount 0 if Product model is not registered', async () => {
      mockConnection.models = {};
      mockCategoryModel.find.mockReturnValue(
        queryResult([{ _id: 'cat-1', name: 'Thời Trang', slug: 'thoi-trang' }]),
      );

      const result = await service.findAllAdmin();
      expect(result[0].productCount).toBe(0);
    });
  });

  describe('update', () => {
    it('should update name without mutating existing slug (TC-CAT-006)', async () => {
      const existing = {
        _id: 'cat-1',
        name: 'Cũ',
        slug: 'slug-cu',
        description: 'Old desc',
        isActive: true,
        save: jest.fn().mockResolvedValue(true),
      };
      mockCategoryModel.findById.mockReturnValue(execResult(existing));
      mockCategoryModel.findOne.mockReturnValue(collationResult(null));

      const result = await service.update('cat-1', {
        name: 'Mới',
        description: 'New desc',
      });
      expect(existing.name).toBe('Mới');
      expect(existing.description).toBe('New desc');
      expect(existing.slug).toBe('slug-cu');
      expect(existing.save).toHaveBeenCalled();
      expect(result.slug).toBe('slug-cu');
    });

    it('should throw NotFoundException if category does not exist', async () => {
      mockCategoryModel.findById.mockReturnValue(execResult(null));
      await expect(
        service.update('non-existent', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when renaming to an existing name (TC-CAT-007)', async () => {
      mockCategoryModel.findById.mockReturnValue(
        execResult({ _id: 'cat-1', name: 'Thời Trang', slug: 'thoi-trang' }),
      );
      mockCategoryModel.findOne.mockReturnValue(
        collationResult({ _id: 'cat-2', name: 'Điện Tử' }),
      );

      await expect(
        service.update('cat-1', { name: 'Điện Tử' }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.update('cat-1', { name: 'Điện Tử' }),
      ).rejects.toThrow('Tên danh mục đã tồn tại');
    });

    it('should throw ConflictException when save throws 11000 duplicate key error', async () => {
      const err = new Error('Duplicate key');
      Object.assign(err, { code: 11000 });
      const existing = {
        _id: 'cat-1',
        name: 'Thời Trang',
        slug: 'thoi-trang',
        save: jest.fn().mockRejectedValue(err),
      };
      mockCategoryModel.findById.mockReturnValue(execResult(existing));
      mockCategoryModel.findOne.mockReturnValue(collationResult(null));

      await expect(
        service.update('cat-1', { name: 'Điện Tử' }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.update('cat-1', { name: 'Điện Tử' }),
      ).rejects.toThrow('Tên danh mục đã tồn tại');
    });

    it('should rethrow non-duplicate error when save fails', async () => {
      const genericErr = new Error('Database connection lost');
      const existing = {
        _id: 'cat-1',
        name: 'Thời Trang',
        slug: 'thoi-trang',
        save: jest.fn().mockRejectedValue(genericErr),
      };
      mockCategoryModel.findById.mockReturnValue(execResult(existing));
      mockCategoryModel.findOne.mockReturnValue(collationResult(null));

      await expect(
        service.update('cat-1', { name: 'Điện Tử' }),
      ).rejects.toThrow(genericErr);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException when deleting non-existent category', async () => {
      mockCategoryModel.findById.mockReturnValue(execResult(null));
      await expect(service.remove('cat-999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when category is referenced by products (TC-CAT-009)', async () => {
      mockCategoryModel.findById.mockReturnValue(execResult({ _id: 'cat-1' }));
      mockProductModel.countDocuments.mockReturnValue(execResult(5));

      await expect(service.remove('cat-1')).rejects.toThrow(
        new BadRequestException(
          'Không thể xóa danh mục đang có 5 sản phẩm liên kết',
        ),
      );
      expect(mockCategoryModel.deleteOne).not.toHaveBeenCalled();
    });

    it('should delete category when zero products are referenced (TC-CAT-008)', async () => {
      mockCategoryModel.findById.mockReturnValue(execResult({ _id: 'cat-1' }));
      mockProductModel.countDocuments.mockReturnValue(execResult(0));
      mockCategoryModel.deleteOne.mockReturnValue(
        execResult({ deletedCount: 1 }),
      );

      const result = await service.remove('cat-1');
      expect(result).toEqual({
        success: true,
        message: 'Xóa danh mục thành công',
      });
      expect(mockCategoryModel.deleteOne).toHaveBeenCalledWith({
        _id: 'cat-1',
      });
    });

    it('should safely delete category if Product model is not registered', async () => {
      mockConnection.models = {};
      mockCategoryModel.findById.mockReturnValue(execResult({ _id: 'cat-1' }));
      mockCategoryModel.deleteOne.mockReturnValue(
        execResult({ deletedCount: 1 }),
      );

      const result = await service.remove('cat-1');
      expect(result).toEqual({
        success: true,
        message: 'Xóa danh mục thành công',
      });
      expect(mockCategoryModel.deleteOne).toHaveBeenCalledWith({
        _id: 'cat-1',
      });
    });
  });
});
