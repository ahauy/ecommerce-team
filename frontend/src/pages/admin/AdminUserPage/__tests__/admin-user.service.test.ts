import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/services/apiClient';
import {
  ADMIN_USER_QUERY_KEYS,
  adminUserService,
  normalizeAdminUser,
  toQueryParams,
} from '../services/admin-user.service';

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPatch = vi.mocked(apiClient.patch);

const rawSeller = {
  id: 'u-1',
  email: 'seller@example.com',
  fullName: 'Người Bán',
  phone: '0901234567',
  role: 'customer',
  isActive: true,
  shop: { shopName: 'Shop A', shopSlug: 'shop-a' },
  productCount: 7,
  createdAt: '2026-10-01T00:00:00.000Z',
};

describe('adminUserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('query key chứa tham số lọc để mỗi bộ lọc có cache riêng', () => {
    expect(ADMIN_USER_QUERY_KEYS.all).toEqual(['admin', 'users']);
    expect(ADMIN_USER_QUERY_KEYS.list({ page: 2, isActive: false })).toEqual([
      'admin',
      'users',
      'list',
      { page: 2, isActive: false },
    ]);
  });

  describe('toQueryParams', () => {
    it('chỉ gửi tham số có giá trị, giữ isActive = false, trim từ khóa', () => {
      expect(
        toQueryParams({ page: 2, limit: 20, role: 'customer', isActive: false, search: '  shop a  ' }),
      ).toEqual({ page: 2, limit: 20, role: 'customer', isActive: false, search: 'shop a' });
    });

    it('bỏ qua từ khóa rỗng và bộ lọc không chọn', () => {
      expect(toQueryParams({ page: 1, search: '   ' })).toEqual({ page: 1 });
    });
  });

  describe('normalizeAdminUser', () => {
    it('chuẩn hóa user có gian hàng', () => {
      expect(normalizeAdminUser(rawSeller)).toEqual({
        id: 'u-1',
        email: 'seller@example.com',
        fullName: 'Người Bán',
        phone: '0901234567',
        role: 'customer',
        isActive: true,
        shop: { shopName: 'Shop A', shopSlug: 'shop-a' },
        productCount: 7,
        createdAt: '2026-10-01T00:00:00.000Z',
      });
    });

    it('user chưa có gian hàng / thiếu field → giá trị mặc định an toàn', () => {
      expect(
        normalizeAdminUser({ _id: 'u-2', email: 'b@example.com', role: 'admin', isActive: false, shop: null }),
      ).toMatchObject({
        id: 'u-2',
        phone: null,
        role: 'admin',
        isActive: false,
        shop: null,
        productCount: 0,
      });
    });
  });

  describe('getUsers', () => {
    it('gọi GET /admin/users với tham số đã lọc và chuẩn hóa kết quả', async () => {
      mockedGet.mockResolvedValueOnce({
        data: { items: [rawSeller], total: 45, page: 2, limit: 20, totalPages: 3 },
      });

      const result = await adminUserService.getUsers({ page: 2, limit: 20, isActive: true });

      expect(mockedGet).toHaveBeenCalledWith('/admin/users', {
        params: { page: 2, limit: 20, isActive: true },
      });
      expect(result.total).toBe(45);
      expect(result.totalPages).toBe(3);
      expect(result.items[0].shop?.shopName).toBe('Shop A');
    });

    it('response thiếu meta → dùng giá trị mặc định', async () => {
      mockedGet.mockResolvedValueOnce({ data: { items: [rawSeller] } });

      const result = await adminUserService.getUsers({ page: 1, limit: 20 });

      expect(result).toMatchObject({ total: 1, page: 1, limit: 20, totalPages: 0 });
    });
  });

  describe('ban / unban', () => {
    it('banUser gọi PATCH /admin/users/:id/ban và trả thông báo từ server', async () => {
      mockedPatch.mockResolvedValueOnce({ data: { message: 'Đã khóa tài khoản và chặn gian hàng/sản phẩm' } });

      await expect(adminUserService.banUser('u-1')).resolves.toBe(
        'Đã khóa tài khoản và chặn gian hàng/sản phẩm',
      );
      expect(mockedPatch).toHaveBeenCalledWith('/admin/users/u-1/ban');
    });

    it('unbanUser gọi PATCH /admin/users/:id/unban, thiếu message thì dùng câu mặc định', async () => {
      mockedPatch.mockResolvedValueOnce({ data: {} });

      await expect(adminUserService.unbanUser('u-1')).resolves.toBe('Đã mở khóa tài khoản');
      expect(mockedPatch).toHaveBeenCalledWith('/admin/users/u-1/unban');
    });
  });
});
