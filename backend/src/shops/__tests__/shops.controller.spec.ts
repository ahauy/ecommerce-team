import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ShopsController } from '../shops.controller';
import { ShopsService } from '../shops.service';
import { PublicShopResponseDto } from '../dto/public-shop.dto';

const mockShopsService = {
  getPublicShop: jest.fn(),
};

describe('ShopsController', () => {
  let controller: ShopsController;
  let service: typeof mockShopsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopsController],
      providers: [{ provide: ShopsService, useValue: mockShopsService }],
    }).compile();

    controller = module.get<ShopsController>(ShopsController);
    service = module.get(ShopsService);
    jest.clearAllMocks();
  });

  describe('getPublicShop', () => {
    it('should return public shop info', async () => {
      const expected: PublicShopResponseDto = {
        sellerId: '66a1b2c3d4e5f67890123456',
        shopName: 'Test Shop',
        shopSlug: 'test-shop',
        joinedAt: new Date('2024-01-15T10:30:00.000Z'),
        productCount: 3,
      };

      service.getPublicShop.mockResolvedValue(expected);

      const result = await controller.getPublicShop('66a1b2c3d4e5f67890123456');

      expect(result).toEqual(expected);
      expect(service.getPublicShop).toHaveBeenCalledWith(
        '66a1b2c3d4e5f67890123456',
      );
    });

    it('should throw NotFoundException when shop not found', async () => {
      service.getPublicShop.mockRejectedValue(new NotFoundException());

      await expect(
        controller.getPublicShop('66a1b2c3d4e5f67890123456'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
