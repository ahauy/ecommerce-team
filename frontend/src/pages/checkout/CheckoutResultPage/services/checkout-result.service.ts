import { apiClient } from '@/services/apiClient';
import type {
  CheckoutPaymentStatus,
  CheckoutResult,
  CheckoutResultItem,
  CheckoutResultOrder,
} from '@/types/checkout-result.types';
import type { OrderStatus } from '@/types/order-history.types';

type Raw = Record<string, unknown>;

const CHECKOUT_STATUSES: CheckoutPaymentStatus[] = ['pending', 'paid', 'failed', 'expired'];
const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled', 'refunded'];

const asString = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);
const asNumber = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const asRecord = (v: unknown): Raw | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : null;
const asArray = (v: unknown): Raw[] =>
  Array.isArray(v) ? v.map(asRecord).filter((r): r is Raw => r !== null) : [];
const asEnum = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;

const normalizeItem = (raw: Raw): CheckoutResultItem | null => {
  const name = asString(raw.name);
  return name ? { name, quantity: asNumber(raw.quantity, 1) } : null;
};

const normalizeOrder = (raw: Raw): CheckoutResultOrder => {
  const seller = asRecord(raw.seller);
  return {
    id: asString(raw.id) ?? asString(raw.orderId) ?? asString(raw._id),
    orderCode: asString(raw.orderCode) ?? '',
    shopName: asString(raw.shopName) ?? (seller ? asString(seller.shopName) : null),
    totalAmount: asNumber(raw.totalAmount),
    status: asEnum(raw.status, ORDER_STATUSES, 'pending'),
    items: asArray(raw.items)
      .map(normalizeItem)
      .filter((i): i is CheckoutResultItem => i !== null),
  };
};

/** Chuẩn hoá phản hồi `GET /checkouts/:checkoutCode` (trạng thái lạ → coi như còn `pending`). */
export const normalizeCheckoutStatus = (raw: Raw | null | undefined, fallbackCode = ''): CheckoutResult => ({
  checkoutCode: asString(raw?.checkoutCode) ?? fallbackCode,
  status: asEnum(raw?.status, CHECKOUT_STATUSES, 'pending'),
  totalAmount: asNumber(raw?.totalAmount),
  orders: asArray(raw?.orders).map(normalizeOrder),
});

export const checkoutResultService = {
  /**
   * `GET /checkouts/:checkoutCode` — trạng thái thật của 1 lần thanh toán.
   * Khi còn `pending`, BE tự tra cứu PayOS nên chạy được cả trên localhost (BR-PAY-006).
   * Không phải chủ checkout / không tồn tại → 404.
   */
  getCheckout: async (checkoutCode: string): Promise<CheckoutResult> => {
    const res = await apiClient.get<Raw>(`/checkouts/${encodeURIComponent(checkoutCode)}`);
    return normalizeCheckoutStatus(res.data, checkoutCode);
  },
};

export default checkoutResultService;
