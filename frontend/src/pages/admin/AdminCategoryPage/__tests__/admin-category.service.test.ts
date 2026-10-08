import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminCategoryService, ADMIN_CATEGORY_QUERY_KEYS } from '../services/admin-category.service';
import { apiClient } from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('adminCategoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('query keys', () => {
    it('defines expected admin cache keys', () => {
      expect(ADMIN_CATEGORY_QUERY_KEYS.adminList).toEqual(['categories', 'admin']);
    });
  });

  describe('getAdminCategories', () => {
    it('fetches admin categories with product counts', async () => {
      const mockAdminList = [
        { _id: '1', name: 'Đồ chơi', slug: 'do-choi', productCount: 12, isActive: true },
      ];
      (apiClient.get as any).mockResolvedValueOnce({
        data: { success: true, data: mockAdminList },
      });

      const result = await adminCategoryService.getAdminCategories();
      expect(apiClient.get).toHaveBeenCalledWith('/admin/categories');
      expect(result).toEqual(mockAdminList);
    });
  });

  describe('createCategory', () => {
    it('posts new category data to /categories', async () => {
      const payload = { name: 'Thủ công', description: 'Mô tả', isActive: true };
      const created = { _id: '3', ...payload, slug: 'thu-cong' };
      (apiClient.post as any).mockResolvedValueOnce({
        data: { success: true, data: created },
      });

      const result = await adminCategoryService.createCategory(payload);
      expect(apiClient.post).toHaveBeenCalledWith('/categories', payload);
      expect(result).toEqual(created);
    });
  });

  describe('updateCategory', () => {
    it('patches category by ID', async () => {
      const payload = { name: 'Gia dụng mới', isActive: false };
      const updated = { _id: '1', name: 'Gia dụng mới', slug: 'gia-dung', isActive: false };
      (apiClient.patch as any).mockResolvedValueOnce({
        data: { success: true, data: updated },
      });

      const result = await adminCategoryService.updateCategory('1', payload);
      expect(apiClient.patch).toHaveBeenCalledWith('/categories/1', payload);
      expect(result).toEqual(updated);
    });
  });

  describe('deleteCategory', () => {
    it('sends delete request to /categories/:id', async () => {
      (apiClient.delete as any).mockResolvedValueOnce({
        data: { success: true, data: { id: '1' } },
      });

      const result = await adminCategoryService.deleteCategory('1');
      expect(apiClient.delete).toHaveBeenCalledWith('/categories/1');
      expect(result).toEqual({ id: '1' });
    });
  });
});
