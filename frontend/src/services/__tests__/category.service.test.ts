import { describe, it, expect, vi, beforeEach } from 'vitest';
import { categoryService, CATEGORY_QUERY_KEYS } from '../category.service';
import { apiClient } from '../apiClient';

vi.mock('../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('categoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('query keys', () => {
    it('defines expected cache keys', () => {
      expect(CATEGORY_QUERY_KEYS.publicList).toEqual(['categories', 'public']);
      expect(CATEGORY_QUERY_KEYS.publicDetail('ao-nam')).toEqual(['categories', 'public', 'ao-nam']);
      expect(CATEGORY_QUERY_KEYS.adminList).toEqual(['categories', 'admin']);
    });
  });

  describe('getCategories', () => {
    it('unwraps enveloped API response', async () => {
      const mockCategories = [
        { _id: '1', name: 'Gia dụng', slug: 'gia-dung', description: '', isActive: true },
      ];
      (apiClient.get as any).mockResolvedValueOnce({
        data: { success: true, message: 'Thành công', data: mockCategories },
      });

      const result = await categoryService.getCategories();
      expect(apiClient.get).toHaveBeenCalledWith('/categories');
      expect(result).toEqual(mockCategories);
    });

    it('handles direct array response if not enveloped', async () => {
      const mockCategories = [
        { _id: '2', name: 'Thời trang', slug: 'thoi-trang', description: '', isActive: true },
      ];
      (apiClient.get as any).mockResolvedValueOnce({ data: mockCategories });

      const result = await categoryService.getCategories();
      expect(result).toEqual(mockCategories);
    });
  });

  describe('getCategoryBySlug', () => {
    it('fetches single category by slug', async () => {
      const mockCat = { _id: '1', name: 'Sách', slug: 'sach', description: '', isActive: true };
      (apiClient.get as any).mockResolvedValueOnce({
        data: { success: true, data: mockCat },
      });

      const result = await categoryService.getCategoryBySlug('sach');
      expect(apiClient.get).toHaveBeenCalledWith('/categories/sach');
      expect(result).toEqual(mockCat);
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

      const result = await categoryService.getAdminCategories();
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

      const result = await categoryService.createCategory(payload);
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

      const result = await categoryService.updateCategory('1', payload);
      expect(apiClient.patch).toHaveBeenCalledWith('/categories/1', payload);
      expect(result).toEqual(updated);
    });
  });

  describe('deleteCategory', () => {
    it('sends delete request to /categories/:id', async () => {
      (apiClient.delete as any).mockResolvedValueOnce({
        data: { success: true, data: { id: '1' } },
      });

      const result = await categoryService.deleteCategory('1');
      expect(apiClient.delete).toHaveBeenCalledWith('/categories/1');
      expect(result).toEqual({ id: '1' });
    });
  });
});
