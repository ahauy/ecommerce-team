import { apiClient } from './apiClient';
import { useQuery } from '@tanstack/react-query';
import type {
  CategoryItem,
  PublicCategoryItem,
  ApiResponseEnvelope,
} from '@/types/category.types';

export const CATEGORY_QUERY_KEYS = {
  publicList: ['categories', 'public'] as const,
  publicDetail: (slug: string) => ['categories', 'public', slug] as const,
};

function unwrapResponse<T>(data: ApiResponseEnvelope<T> | T): T {
  if (data && typeof data === 'object' && 'data' in data && 'success' in data) {
    return (data as ApiResponseEnvelope<T>).data;
  }
  return data as T;
}

export const categoryService = {
  // ── Public Storefront Endpoints ─────────────────────────────────────────────
  getCategories: async (): Promise<PublicCategoryItem[]> => {
    const res = await apiClient.get<ApiResponseEnvelope<PublicCategoryItem[]> | PublicCategoryItem[]>('/categories');
    return unwrapResponse(res.data);
  },

  getCategoryBySlug: async (slug: string): Promise<CategoryItem> => {
    const res = await apiClient.get<ApiResponseEnvelope<CategoryItem> | CategoryItem>(`/categories/${slug}`);
    return unwrapResponse(res.data);
  },

  // ── TanStack Query Hooks ────────────────────────────────────────────────────
  useCategories: (enabled = true) => {
    return useQuery({
      queryKey: CATEGORY_QUERY_KEYS.publicList,
      queryFn: categoryService.getCategories,
      enabled,
    });
  },

  useCategoryBySlug: (slug: string, enabled = true) => {
    return useQuery({
      queryKey: CATEGORY_QUERY_KEYS.publicDetail(slug),
      queryFn: () => categoryService.getCategoryBySlug(slug),
      enabled: enabled && !!slug,
    });
  },
};

export default categoryService;
