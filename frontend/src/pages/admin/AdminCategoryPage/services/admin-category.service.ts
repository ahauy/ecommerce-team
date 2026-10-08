import { apiClient } from '@/services/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CategoryItem,
  AdminCategoryItem,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  DeleteCategoryResponse,
  ApiResponseEnvelope,
} from '@/types/category.types';
import { CATEGORY_QUERY_KEYS } from '@/services/category.service';

export const ADMIN_CATEGORY_QUERY_KEYS = {
  adminList: ['categories', 'admin'] as const,
};

function unwrapResponse<T>(data: ApiResponseEnvelope<T> | T): T {
  if (data && typeof data === 'object' && 'data' in data && 'success' in data) {
    return (data as ApiResponseEnvelope<T>).data;
  }
  return data as T;
}

export const adminCategoryService = {
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
  useAdminCategories: () => {
    return useQuery({
      queryKey: ADMIN_CATEGORY_QUERY_KEYS.adminList,
      queryFn: adminCategoryService.getAdminCategories,
    });
  },

  useCreateCategory: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: adminCategoryService.createCategory,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORY_QUERY_KEYS.adminList });
        queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.publicList });
      },
    });
  },

  useUpdateCategory: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryPayload }) =>
        adminCategoryService.updateCategory(id, payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORY_QUERY_KEYS.adminList });
        queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.publicList });
      },
    });
  },

  useDeleteCategory: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => adminCategoryService.deleteCategory(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORY_QUERY_KEYS.adminList });
        queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.publicList });
      },
    });
  },
};

export default adminCategoryService;
