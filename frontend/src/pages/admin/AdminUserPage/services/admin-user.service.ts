import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { PRODUCT_KEYS } from '@/hooks/queries/useProducts';
import type { AdminUser, AdminUserRole, AdminUsersParams, AdminUsersResult } from '../types';

type Raw = Record<string, unknown>;

export const ADMIN_USER_QUERY_KEYS = {
  all: ['admin', 'users'] as const,
  list: (params: AdminUsersParams) => ['admin', 'users', 'list', params] as const,
};

const asString = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);
const asNumber = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const asRecord = (v: unknown): Raw | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : null;
const asArray = (v: unknown): Raw[] =>
  Array.isArray(v) ? v.map(asRecord).filter((r): r is Raw => r !== null) : [];

export const normalizeAdminUser = (raw: Raw): AdminUser => {
  const shop = asRecord(raw.shop);
  const shopName = asString(shop?.shopName);
  return {
    id: asString(raw.id) ?? asString(raw._id) ?? '',
    email: asString(raw.email) ?? '',
    fullName: asString(raw.fullName) ?? '',
    phone: asString(raw.phone),
    role: (raw.role === 'admin' ? 'admin' : 'customer') satisfies AdminUserRole,
    isActive: raw.isActive !== false,
    shop: shopName ? { shopName, shopSlug: asString(shop?.shopSlug) } : null,
    productCount: asNumber(raw.productCount),
    createdAt: asString(raw.createdAt) ?? '',
  };
};

export const toQueryParams = (params: AdminUsersParams): Record<string, string | number | boolean> => {
  const query: Record<string, string | number | boolean> = {};
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  if (params.role) query.role = params.role;
  if (params.isActive !== undefined) query.isActive = params.isActive;
  const search = params.search?.trim();
  if (search) query.search = search;
  return query;
};

export const adminUserService = {
  getUsers: async (params: AdminUsersParams = {}): Promise<AdminUsersResult> => {
    const res = await apiClient.get<Raw>('/admin/users', { params: toQueryParams(params) });
    const body = asRecord(res.data) ?? {};
    const items = asArray(body.items).map(normalizeAdminUser);
    return {
      items,
      total: asNumber(body.total, items.length),
      page: asNumber(body.page, params.page ?? 1),
      limit: asNumber(body.limit, params.limit ?? items.length),
      totalPages: asNumber(body.totalPages, 0),
    };
  },

  banUser: async (id: string): Promise<string> => {
    const res = await apiClient.patch<Raw>(`/admin/users/${id}/ban`);
    return asString(asRecord(res.data)?.message) ?? 'Đã khóa tài khoản';
  },

  unbanUser: async (id: string): Promise<string> => {
    const res = await apiClient.patch<Raw>(`/admin/users/${id}/unban`);
    return asString(asRecord(res.data)?.message) ?? 'Đã mở khóa tài khoản';
  },

  useAdminUsers: (params: AdminUsersParams) =>
    useQuery({
      queryKey: ADMIN_USER_QUERY_KEYS.list(params),
      queryFn: () => adminUserService.getUsers(params),
      placeholderData: keepPreviousData,
    }),

  useBanUser: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => adminUserService.banUser(id),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ADMIN_USER_QUERY_KEYS.all });
        void queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      },
    });
  },

  useUnbanUser: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => adminUserService.unbanUser(id),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ADMIN_USER_QUERY_KEYS.all });
        void queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      },
    });
  },
};

export default adminUserService;
