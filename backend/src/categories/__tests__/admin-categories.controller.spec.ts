import { Test, TestingModule } from '@nestjs/testing';
import { AdminCategoriesController } from '../admin-categories.controller';
import { CategoriesService } from '../categories.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard, UserRole, ROLES_KEY } from '../../auth/guards/roles.guard';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { Reflector } from '@nestjs/core';

describe('AdminCategoriesController', () => {
  let controller: AdminCategoriesController;
  let service: CategoriesService;

  const mockCategories = [
    {
      _id: 'cat-1',
      name: 'Điện Thoại',
      slug: 'dien-thoai',
      description: 'Mô tả',
      imageUrl: null,
      isActive: true,
      createdAt: '2026-10-06T00:00:00.000Z',
      updatedAt: '2026-10-06T00:00:00.000Z',
      productCount: 15,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminCategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: {
            findAllAdmin: jest.fn().mockResolvedValue(mockCategories),
            create: jest.fn().mockImplementation((dto) =>
              Promise.resolve({
                _id: 'new-id',
                ...dto,
                slug: 'dien-tu',
              }),
            ),
            update: jest.fn().mockImplementation((id, dto) =>
              Promise.resolve({
                _id: id,
                ...dto,
                slug: 'dien-thoai',
              }),
            ),
            remove: jest.fn().mockResolvedValue({
              success: true,
              message: 'Xóa danh mục thành công',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminCategoriesController>(
      AdminCategoriesController,
    );
    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all categories with product counts (TC-CAT-002)', async () => {
      const result = await controller.findAll();
      expect(result).toEqual(mockCategories);
      expect(service.findAllAdmin).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    it('should create a category and return 201 created document (TC-CAT-003)', async () => {
      const dto: CreateCategoryDto = {
        name: 'Điện Tử',
        description: 'Đồ điện tử',
        isActive: true,
      };

      const result = await controller.create(dto);
      expect(result).toEqual({
        _id: 'new-id',
        name: 'Điện Tử',
        description: 'Đồ điện tử',
        isActive: true,
        slug: 'dien-tu',
      });
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should update a category with provided ID and payload (TC-CAT-006)', async () => {
      const dto: UpdateCategoryDto = {
        name: 'Điện Thoại & Tablet',
        isActive: false,
      };

      const result = await controller.update('cat-1', dto);
      expect(result).toEqual({
        _id: 'cat-1',
        name: 'Điện Thoại & Tablet',
        isActive: false,
        slug: 'dien-thoai',
      });
      expect(service.update).toHaveBeenCalledWith('cat-1', dto);
    });
  });

  describe('remove', () => {
    it('should delete a category and return service response (TC-CAT-008)', async () => {
      const result = await controller.remove('6701a2b3c4d5e6f7a8b9c0d1');
      expect(service.remove).toHaveBeenCalledWith('6701a2b3c4d5e6f7a8b9c0d1');
      expect(result).toEqual({
        success: true,
        message: 'Xóa danh mục thành công',
      });
    });
  });

  describe('Guards and Role Decorators (TC-CAT-010)', () => {
    it('should have Admin role and guards applied', () => {
      const reflector = new Reflector();
      const roles = reflector.get<string[]>(
        ROLES_KEY,
        AdminCategoriesController,
      );
      expect(roles).toContain(UserRole.ADMIN);

      const guards = Reflect.getMetadata(
        '__guards__',
        AdminCategoriesController,
      );
      expect(guards).toContain(JwtAuthGuard);
      expect(guards).toContain(RolesGuard);
    });
  });
});
