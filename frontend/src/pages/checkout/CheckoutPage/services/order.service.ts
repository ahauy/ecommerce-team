import { apiClient } from '@/services/apiClient';
import type {
  CheckoutOrderSummary,
  CreateCheckoutPayload,
  CreateCheckoutResult,
  StockShortage,
} from '@/types/order.types';

type Raw = Record<string, unknown>;

const asString = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);
const asNumber = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const asRecord = (v: unknown): Raw | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : null;
const asArray = (v: unknown): Raw[] =>
  Array.isArray(v) ? v.map(asRecord).filter((r): r is Raw => r !== null) : [];

const normalizeOrder = (raw: Raw): CheckoutOrderSummary => {
  const seller = asRecord(raw.seller) ?? {};
  return {
    orderId: asString(raw.orderId) ?? asString(raw.id) ?? '',
    orderCode: asString(raw.orderCode) ?? '',
    seller: {
      id: asString(seller.id) ?? asString(seller._id) ?? '',
      shopName: asString(seller.shopName),
    },
    totalAmount: asNumber(raw.totalAmount),
  };
};

/** Chuẩn hoá phản hồi 201 của `POST /orders`. */
export const normalizeCheckoutResult = (raw: Raw | null | undefined): CreateCheckoutResult => ({
  checkoutId: asString(raw?.checkoutId) ?? asString(raw?.id) ?? '',
  checkoutCode: asString(raw?.checkoutCode) ?? '',
  totalAmount: asNumber(raw?.totalAmount),
  expiresAt: asString(raw?.expiresAt) ?? '',
  orders: asArray(raw?.orders).map(normalizeOrder),
  paymentUrl: asString(raw?.paymentUrl) ?? '',
});

/**
 * Đọc danh sách SP thiếu hàng từ lỗi 400 của `POST /orders`
 * (`{ success:false, message, errors:[{ productId, name, available, requested }] }`).
 * Không phải lỗi thiếu hàng → mảng rỗng.
 */
export const extractStockShortages = (error: unknown): StockShortage[] => {
  if (!error || typeof error !== 'object' || !('response' in error)) return [];
  const data = asRecord((error as { response?: { data?: unknown } }).response?.data);
  return asArray(data?.errors)
    .map((e) => ({
      productId: asString(e.productId) ?? '',
      name: asString(e.name) ?? '',
      available: asNumber(e.available),
      requested: asNumber(e.requested),
    }))
    .filter((e) => e.productId !== '');
};

export const orderService = {
  /** `POST /orders` — tạo 1 Checkout + N Order (mỗi shop 1 Order), trừ stock, trả `paymentUrl` (link thanh toán PayOS). */
  createCheckout: async (payload: CreateCheckoutPayload): Promise<CreateCheckoutResult> => {
    const res = await apiClient.post<Raw>('/orders', payload);
    return normalizeCheckoutResult(res.data);
  },
};

export default orderService;
