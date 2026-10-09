import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { PRODUCT_KEYS } from '@/hooks/queries/useProducts';
import type { AdminProduct, AdminProductSeller, AdminProductsParams, AdminProductsResult } from '../types';

type Raw = Record<string, unknown>;

export const ADMIN_PRODUCT_QUERY_KEYS = {
  all: ['admin', 'products'] as const,
  list: (params: AdminProductsParams) => ['admin', 'products', 'list', params] as const,
};

const asString = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);
const asNumber = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const asRecord = (v: unknown): Raw | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : null;
const asArray = (v: unknown): Raw[] =>
  Array.isArray(v) ? v.map(asRecord).filter((r): r is Raw => r !== null) : [];

const normalizeSeller = (raw: Raw | null): AdminProductSeller | null => {
  const id = asString(raw?.id) ?? asString(raw?._id);
  if (!raw || !id) return null;
  return {
    id,
    fullName: asString(raw.fullName) ?? '',
    email: asString(raw.email) ?? '',
    shopName: asString(raw.shopName),
    isActive: raw.isActive !== false,
  };
};

export const normalizeAdminProduct = (raw: Raw): AdminProduct => {
  const category = asRecord(raw.category);
  const categoryId = asString(category?.id) ?? asString(category?._id);
  return {
    id: asString(raw.id) ?? asString(raw._id) ?? '',
    name: asString(raw.name) ?? '',
    slug: asString(raw.slug) ?? '',
    price: asNumber(raw.price),
    stock: asNumber(raw.stock),
    imageUrl: asString(raw.imageUrl),
    isActive: raw.isActive !== false,
    isBlocked: raw.isBlocked === true,
    blockReason: asString(raw.blockReason),
    category: categoryId ? { id: categoryId, name: asString(category?.name) ?? '' } : null,
    seller: normalizeSeller(asRecord(raw.seller)),
    createdAt: asString(raw.createdAt) ?? '',
  };
};

export const toQueryParams = (params: AdminProductsParams): Record<string, string | number | boolean> => {
  const query: Record<string, string | number | boolean> = {};
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  if (params.isBlocked !== undefined) query.isBlocked = params.isBlocked;
  if (params.sellerId) query.sellerId = params.sellerId;
  const search = params.search?.trim();
  if (search) query.search = search;
  return query;
};

export const adminProductService = {
  getProducts: async (params: AdminProductsParams = {}): Promise<AdminProductsResult> => {
    const res = await apiClient.get<Raw>('/admin/products', { params: toQueryParams(params) });
    const body = asRecord(res.data) ?? {};
    const items = asArray(body.items).map(normalizeAdminProduct);
    return {
      items,
      total: asNumber(body.total, items.length),
      page: asNumber(body.page, params.page ?? 1),
      limit: asNumber(body.limit, params.limit ?? items.length),
      totalPages: asNumber(body.totalPages, 0),
    };
  },

  blockProduct: async (id: string, reason: string): Promise<AdminProduct> => {
    const res = await apiClient.patch<Raw>(`/admin/products/${id}/block`, { reason: reason.trim() });
    return normalizeAdminProduct(asRecord(res.data) ?? {});
  },

  unblockProduct: async (id: string): Promise<AdminProduct> => {
    const res = await apiClient.patch<Raw>(`/admin/products/${id}/unblock`);
    return normalizeAdminProduct(asRecord(res.data) ?? {});
  },

  useAdminProducts: (params: AdminProductsParams) =>
    useQuery({
      queryKey: ADMIN_PRODUCT_QUERY_KEYS.list(params),
      queryFn: () => adminProductService.getProducts(params),
      placeholderData: keepPreviousData,
    }),

  useBlockProduct: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) => adminProductService.blockProduct(id, reason),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCT_QUERY_KEYS.all });
        void queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      },
    });
  },

  useUnblockProduct: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => adminProductService.unblockProduct(id),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCT_QUERY_KEYS.all });
        void queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      },
    });
  },
};

export default adminProductService;
