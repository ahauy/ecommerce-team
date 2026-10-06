import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from '../categories.controller';
import { CategoriesService } from '../categories.service';
import { NotFoundException } from '@nestjs/common';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  const mockCategories = [
    {
      _id: 'cat-1',
      name: 'Điện Thoại',
      slug: 'dien-thoai',
      isActive: true,
    },
    {
      _id: 'cat-2',
      name: 'Laptop',
      slug: 'laptop',
      isActive: true,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: {
            findActive: jest.fn().mockResolvedValue(mockCategories),
            findBySlug: jest.fn().mockImplementation((slug: string) => {
              const found = mockCategories.find((c) => c.slug === slug);
              if (!found) {
                throw new NotFoundException('Không tìm thấy danh mục');
              }
              return Promise.resolve(found);
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('findActive', () => {
    it('should return active categories for public storefront', async () => {
      const result = await controller.findActive();
      expect(result).toEqual(mockCategories);
      expect(service.findActive).toHaveBeenCalledTimes(1);
    });
  });

  describe('findBySlug', () => {
    it('should return a category when given a valid slug', async () => {
      const result = await controller.findBySlug('dien-thoai');
      expect(result).toEqual(mockCategories[0]);
      expect(service.findBySlug).toHaveBeenCalledWith('dien-thoai');
    });

    it('should throw NotFoundException if slug not found', async () => {
      await expect(controller.findBySlug('not-exist')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
