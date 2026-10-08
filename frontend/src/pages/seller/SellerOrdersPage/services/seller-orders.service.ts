import { apiClient } from '@/services/apiClient';
import { normalizeMyOrder } from '@/services/order-history.service';
import type { SellerOrder, SellerOrdersParams, SellerOrdersResult, UpdateOrderStatusPayload } from '../types';

type Raw = Record<string, unknown>;

export const SELLER_ORDERS_QUERY_KEY = ['seller', 'orders'] as const;

const asRecord = (v: unknown): Raw | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : null;
const asNumber = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const asRawList = (v: unknown): Raw[] =>
  Array.isArray(v) ? v.map(asRecord).filter((r): r is Raw => r !== null) : [];

export const sellerOrdersService = {
  /** `GET /orders/selling` — chỉ đơn có `sellerId` = mình, lọc `status`, phân trang, mới nhất trước. */
  getSellingOrders: async (params: SellerOrdersParams = {}): Promise<SellerOrdersResult> => {
    const query: Record<string, string | number> = {};
    if (params.page) query.page = params.page;
    if (params.limit) query.limit = params.limit;
    if (params.status) query.status = params.status;

    const res = await apiClient.get<Raw | Raw[]>('/orders/selling', { params: query });
    const body = res.data;
    const rawItems = Array.isArray(body) ? asRawList(body) : asRawList(asRecord(body)?.items);
    const meta = Array.isArray(body) ? {} : (asRecord(body) ?? {});

    return {
      items: rawItems.map(normalizeMyOrder),
      total: asNumber(meta.total, rawItems.length),
      page: asNumber(meta.page, params.page ?? 1),
      limit: asNumber(meta.limit, params.limit ?? rawItems.length),
      totalPages: Math.max(1, asNumber(meta.totalPages, 1)),
    };
  },

  /** `GET /orders/selling/:id` — đơn của shop khác / không tồn tại → 404. */
  getSellingOrderById: async (id: string): Promise<SellerOrder> => {
    const res = await apiClient.get<Raw>(`/orders/selling/${id}`);
    return normalizeMyOrder(res.data);
  },

  /**
   * `PATCH /orders/:id/status` — Seller của đơn: confirmed→shipping, shipping→delivered,
   * confirmed→cancelled (kèm `reason`). Sai chiều → 400, sai chủ → 403.
   */
  updateStatus: async (id: string, payload: UpdateOrderStatusPayload): Promise<void> => {
    await apiClient.patch(`/orders/${id}/status`, payload);
  },
};

export default sellerOrdersService;
