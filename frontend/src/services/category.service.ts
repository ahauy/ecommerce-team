import { apiClient } from './apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CategoryItem,
  PublicCategoryItem,
  AdminCategoryItem,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  DeleteCategoryResponse,
  ApiResponseEnvelope,
} from '@/interfaces/category';

export const CATEGORY_QUERY_KEYS = {
  publicList: ['categories', 'public'] as const,
  publicDetail: (slug: string) => ['categories', 'public', slug] as const,
  adminList: ['categories', 'admin'] as const,
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

  // ── Administrative Endpoints ────────────────────────────────────────────────
  getAdminCategories: async (): Promise<AdminCategoryItem[]> => {
    const res = await apiClient.get<ApiResponseEnvelope<AdminCategoryItem[]> | AdminCategoryItem[]>('/admin/categories');
    return unwrapResponse(res.data);
  },

  createCategory: async (payload: CreateCategoryPayload): Promise<CategoryItem> => {
    const res = await apiClient.post<ApiResponseEnvelope<CategoryItem> | CategoryItem>('/categories', payload);
    return unwrapResponse(res.data);
  },

  updateCategory: async (id: string, payload: UpdateCategoryPayload): Promise<CategoryItem> => {
    const res = await apiClient.patch<ApiResponseEnvelope<CategoryItem> | CategoryItem>(`/categories/${id}`, payload);
    return unwrapResponse(res.data);
  },

  deleteCategory: async (id: string): Promise<DeleteCategoryResponse> => {
    const res = await apiClient.delete<ApiResponseEnvelope<DeleteCategoryResponse> | DeleteCategoryResponse>(`/categories/${id}`);
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

  useAdminCategories: () => {
    return useQuery({
      queryKey: CATEGORY_QUERY_KEYS.adminList,
      queryFn: categoryService.getAdminCategories,
    });
  },

  useCreateCategory: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: categoryService.createCategory,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.adminList });
        queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.publicList });
      },
    });
  },

  useUpdateCategory: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryPayload }) =>
        categoryService.updateCategory(id, payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.adminList });
        queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.publicList });
      },
    });
  },

  useDeleteCategory: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => categoryService.deleteCategory(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.adminList });
        queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.publicList });
      },
    });
  },
};

export default categoryService;
