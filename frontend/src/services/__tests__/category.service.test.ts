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
    });
  });

  describe('getCategories', () => {
    it('unwraps enveloped API response', async () => {
      const mockCategories = [
        { id: '1', name: 'Gia dụng', slug: 'gia-dung', imageUrl: null },
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
        { id: '2', name: 'Thời trang', slug: 'thoi-trang', imageUrl: null },
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
});
