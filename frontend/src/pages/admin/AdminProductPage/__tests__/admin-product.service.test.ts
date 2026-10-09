import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/services/apiClient';
import {
  ADMIN_PRODUCT_QUERY_KEYS,
  adminProductService,
  normalizeAdminProduct,
  toQueryParams,
} from '../services/admin-product.service';

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPatch = vi.mocked(apiClient.patch);

const rawProduct = {
  id: 'p-1',
  name: 'Áo thun',
  slug: 'ao-thun-abc123',
  price: 100000,
  stock: 5,
  imageUrl: 'https://res.cloudinary.com/demo/a.jpg',
  isActive: true,
  isBlocked: true,
  blockReason: 'Hàng giả',
  category: { id: 'c-1', name: 'Thời trang' },
  seller: {
    id: 'u-1',
    fullName: 'Người Bán',
    email: 'seller@example.com',
    shopName: 'Shop A',
    isActive: false,
  },
  createdAt: '2026-10-01T00:00:00.000Z',
};

describe('adminProductService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('query key chứa tham số lọc', () => {
    expect(ADMIN_PRODUCT_QUERY_KEYS.all).toEqual(['admin', 'products']);
    expect(ADMIN_PRODUCT_QUERY_KEYS.list({ page: 2, isBlocked: true })).toEqual([
      'admin',
      'products',
      'list',
      { page: 2, isBlocked: true },
    ]);
  });

  describe('toQueryParams', () => {
    it('chỉ gửi tham số có giá trị, giữ isBlocked = false, trim từ khóa', () => {
      expect(
        toQueryParams({ page: 2, limit: 20, isBlocked: false, sellerId: 'u-1', search: '  áo  ' })
      ).toEqual({ page: 2, limit: 20, isBlocked: false, sellerId: 'u-1', search: 'áo' });
    });

    it('bỏ qua từ khóa rỗng và bộ lọc không chọn', () => {
      expect(toQueryParams({ page: 1, search: '  ' })).toEqual({ page: 1 });
    });
  });

  describe('normalizeAdminProduct', () => {
    it('chuẩn hóa đầy đủ', () => {
      expect(normalizeAdminProduct(rawProduct)).toEqual(rawProduct);
    });

    it('thiếu danh mục / người bán / ảnh → null, trạng thái mặc định an toàn', () => {
      expect(normalizeAdminProduct({ _id: 'p-2', name: 'X', category: null, seller: null })).toMatchObject({
        id: 'p-2',
        imageUrl: null,
        isActive: true,
        isBlocked: false,
        blockReason: null,
        category: null,
        seller: null,
        price: 0,
        stock: 0,
      });
    });
  });

  describe('getProducts', () => {
    it('gọi GET /admin/products với tham số đã lọc và chuẩn hóa kết quả', async () => {
      mockedGet.mockResolvedValueOnce({
        data: { items: [rawProduct], total: 41, page: 3, limit: 20, totalPages: 3 },
      });

      const result = await adminProductService.getProducts({ page: 3, limit: 20, isBlocked: true });

      expect(mockedGet).toHaveBeenCalledWith('/admin/products', {
        params: { page: 3, limit: 20, isBlocked: true },
      });
      expect(result).toMatchObject({ total: 41, page: 3, totalPages: 3 });
      expect(result.items[0].seller?.shopName).toBe('Shop A');
    });

    it('response thiếu meta → giá trị mặc định', async () => {
      mockedGet.mockResolvedValueOnce({ data: {} });

      await expect(adminProductService.getProducts({ page: 1, limit: 20 })).resolves.toEqual({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });
    });
  });

  describe('block / unblock', () => {
    it('blockProduct gửi lý do đã trim, trả SP sau khi cập nhật', async () => {
      mockedPatch.mockResolvedValueOnce({ data: rawProduct });

      const product = await adminProductService.blockProduct('p-1', '  Hàng giả  ');

      expect(mockedPatch).toHaveBeenCalledWith('/admin/products/p-1/block', { reason: 'Hàng giả' });
      expect(product.isBlocked).toBe(true);
    });

    it('unblockProduct gọi PATCH /admin/products/:id/unblock', async () => {
      mockedPatch.mockResolvedValueOnce({ data: { ...rawProduct, isBlocked: false, blockReason: null } });

      const product = await adminProductService.unblockProduct('p-1');

      expect(mockedPatch).toHaveBeenCalledWith('/admin/products/p-1/unblock');
      expect(product).toMatchObject({ isBlocked: false, blockReason: null });
    });
  });
});
