import { apiClient } from '@/services/apiClient';
import type {
  MyOrder,
  MyOrdersParams,
  MyOrdersResult,
  OrderCancelledBy,
  OrderLineItem,
  OrderPaymentStatus,
  OrderRecipientInfo,
  OrderStatus,
} from '@/types/order-history.types';

type Raw = Record<string, unknown>;

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled', 'refunded'];
const PAYMENT_STATUSES: OrderPaymentStatus[] = ['unpaid', 'paid', 'refunded'];
const CANCELLED_BY: OrderCancelledBy[] = ['system', 'seller', 'admin'];

const asString = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);
const asNumber = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const asRecord = (v: unknown): Raw | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : null;
const asArray = (v: unknown): Raw[] =>
  Array.isArray(v) ? v.map(asRecord).filter((r): r is Raw => r !== null) : [];
const asEnum = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;

const normalizeItem = (raw: Raw): OrderLineItem => ({
  productId: asString(raw.productId) ?? asString(raw.id),
  name: asString(raw.name) ?? '',
  imageUrl: asString(raw.imageUrl),
  price: asNumber(raw.price),
  quantity: asNumber(raw.quantity, 1),
});

const normalizeRecipient = (value: unknown): OrderRecipientInfo | null => {
  const raw = asRecord(value);
  if (!raw) return null;
  return {
    fullName: asString(raw.fullName) ?? '',
    phone: asString(raw.phone) ?? '',
    email: asString(raw.email),
    address: asString(raw.address) ?? '',
  };
};

/** Chuẩn hoá 1 đơn mua. Chấp nhận `_id`, `seller` hoặc `sellerShopName` phẳng. */
export const normalizeMyOrder = (raw: Raw): MyOrder => {
  const seller = asRecord(raw.seller) ?? asRecord(raw.sellerId) ?? {};
  const items = asArray(raw.items).map(normalizeItem);
  const cancelledBy = asString(raw.cancelledBy);

  return {
    id: asString(raw.id) ?? asString(raw._id) ?? '',
    orderCode: asString(raw.orderCode) ?? '',
    checkoutCode: asString(raw.checkoutCode) ?? '',
    seller: {
      id: asString(seller.id) ?? asString(seller._id) ?? asString(raw.sellerId) ?? '',
      shopName: asString(seller.shopName) ?? asString(raw.sellerShopName),
    },
    items,
    totalAmount: asNumber(raw.totalAmount, items.reduce((sum, i) => sum + i.price * i.quantity, 0)),
    status: asEnum(raw.status, STATUSES, 'pending'),
    paymentStatus: asEnum(raw.paymentStatus, PAYMENT_STATUSES, 'unpaid'),
    paymentMethod: asString(raw.paymentMethod),
    recipient: normalizeRecipient(raw.recipient),
    cancelReason: asString(raw.cancelReason),
    cancelledBy: cancelledBy && (CANCELLED_BY as string[]).includes(cancelledBy) ? (cancelledBy as OrderCancelledBy) : null,
    createdAt: asString(raw.createdAt) ?? '',
    updatedAt: asString(raw.updatedAt),
  };
};

export const orderHistoryService = {
  /** `GET /orders/my` — đơn đã mua của mình, mới nhất trước, có phân trang. */
  getMyOrders: async (params: MyOrdersParams = {}): Promise<MyOrdersResult> => {
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
  },

  /** `GET /orders/my/:id` — đơn của người khác / không tồn tại → 404. */
  getMyOrderById: async (id: string): Promise<MyOrder> => {
    const res = await apiClient.get<Raw>(`/orders/my/${id}`);
    return normalizeMyOrder(res.data);
  },
};

export default orderHistoryService;
