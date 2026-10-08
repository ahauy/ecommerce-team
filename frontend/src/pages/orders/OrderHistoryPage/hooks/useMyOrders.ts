import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { normalizeMyOrder } from '@/helpers/orderHistory';
import { useAuthStore } from '@/stores/auth.store';
import type { MyOrdersParams, MyOrdersResult } from '@/types/order-history.types';

type Raw = Record<string, unknown>;

const asNumber = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const asRecord = (v: unknown): Raw | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : null;
const asArray = (v: unknown): Raw[] =>
  Array.isArray(v) ? v.map(asRecord).filter((r): r is Raw => r !== null) : [];

export const getMyOrdersApi = async (params: MyOrdersParams = {}): Promise<MyOrdersResult> => {
  const query: Record<string, string | number> = {};
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  if (params.status) query.status = params.status;

  const res = await apiClient.get<Raw | Raw[]>('/orders/my', { params: query });
  const body = res.data;
  const rawItems = Array.isArray(body) ? asArray(body) : asArray(asRecord(body)?.items);
  const meta = Array.isArray(body) ? {} : (asRecord(body) ?? {});

  return {
    items: rawItems.map(normalizeMyOrder),
    total: asNumber(meta.total, rawItems.length),
    page: asNumber(meta.page, params.page ?? 1),
    limit: asNumber(meta.limit, params.limit ?? rawItems.length),
    totalPages: Math.max(1, asNumber(meta.totalPages, 1)),
  };
};

/** Trạng thái đơn đổi theo người bán / thanh toán → luôn tải lại khi vào trang. */
const MY_ORDER_QUERY_OPTIONS = { staleTime: 10_000, refetchOnMount: true } as const;

export const MY_ORDER_KEYS = {
  all: ['my-orders'] as const,
  list: (viewerId: string, params: MyOrdersParams) => ['my-orders', 'list', viewerId, params] as const,
};

/** Danh sách đơn mua (giữ dữ liệu trang cũ khi đang tải trang/tab mới). */
export const useMyOrders = (params: MyOrdersParams) => {
  const viewerId = useAuthStore((s) => s.user?.id ?? '');
  return useQuery({
    queryKey: MY_ORDER_KEYS.list(viewerId, params),
    queryFn: () => getMyOrdersApi(params),
    placeholderData: keepPreviousData,
    enabled: !!viewerId,
    ...MY_ORDER_QUERY_OPTIONS,
  });
};

export default useMyOrders;
