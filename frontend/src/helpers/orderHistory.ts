import type { MyOrder, OrderCancelledBy, OrderPaymentStatus, OrderStatus } from '@/types/order-history.types';

/** Nhãn + màu badge cho từng trạng thái đơn (bám giao diện "Đơn mua"). */
export const ORDER_STATUS_META: Record<OrderStatus, { label: string; badgeClass: string }> = {
  pending: { label: 'Chờ thanh toán', badgeClass: 'border-zinc-300 bg-white text-zinc-600' },
  confirmed: { label: 'Đã xác nhận', badgeClass: 'border-transparent bg-[#c1fbd4] text-[#0f5132]' },
  shipping: { label: 'Đang giao', badgeClass: 'border-[#86d9a3] bg-white text-[#0f5132]' },
  delivered: { label: 'Đã giao', badgeClass: 'border-black bg-black text-white' },
  cancelled: { label: 'Đã hủy', badgeClass: 'border-red-300 bg-white text-red-600' },
  refunded: { label: 'Đã hoàn tiền', badgeClass: 'border-transparent bg-zinc-200 text-zinc-700' },
};

export type OrderTabKey = 'all' | Exclude<OrderStatus, 'pending'>;

/** Các tab lọc trên trang "Đơn mua" (đúng thứ tự trong thiết kế). */
export const ORDER_TABS: { key: OrderTabKey; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'shipping', label: 'Đang giao' },
  { key: 'delivered', label: 'Đã giao' },
  { key: 'cancelled', label: 'Đã hủy' },
  { key: 'refunded', label: 'Đã hoàn tiền' },
];

/** `?status=` trên URL → tab hợp lệ (giá trị lạ → "Tất cả"). */
export const parseTabParam = (value: string | null): OrderTabKey =>
  ORDER_TABS.some((t) => t.key === value) ? (value as OrderTabKey) : 'all';

/** `?page=` trên URL → số trang nguyên ≥ 1. */
export const parsePageParam = (value: string | null): number => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
};

const pad = (n: number) => String(n).padStart(2, '0');

/** "2026-09-15T07:32:00Z" → "15/09/2026" (rỗng nếu không hợp lệ). */
export const formatOrderDate = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

/** "2026-09-15T07:32:00Z" → "15/09/2026 14:32" (giờ địa phương). */
export const formatOrderDateTime = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${formatOrderDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export interface CheckoutGroup {
  checkoutCode: string;
  createdAt: string;
  orders: MyOrder[];
}

/**
 * Gom các đơn cùng `checkoutCode` thành 1 nhóm "Thanh toán ...".
 * Giữ nguyên thứ tự (mới nhất trước); chỉ gom các đơn liền kề + trùng mã.
 * Đơn không có `checkoutCode` đứng riêng 1 nhóm.
 */
export const groupOrdersByCheckout = (orders: MyOrder[]): CheckoutGroup[] => {
  const groups: CheckoutGroup[] = [];
  orders.forEach((order) => {
    const last = groups[groups.length - 1];
    if (last && order.checkoutCode && last.checkoutCode === order.checkoutCode) {
      last.orders.push(order);
      return;
    }
    groups.push({ checkoutCode: order.checkoutCode, createdAt: order.createdAt, orders: [order] });
  });
  return groups;
};

export const PAYMENT_STATUS_LABEL: Record<OrderPaymentStatus, string> = {
  unpaid: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  refunded: 'Đã hoàn tiền',
};

export const getPaymentMethodLabel = (method: string | null): string => {
  if (!method) return '—';
  const key = method.toLowerCase();
  if (key === 'payos') return 'PayOS';
  if (key === 'vnpay') return 'VNPay';
  return method;
};

export const getCancelledByLabel = (by: OrderCancelledBy | null): string => {
  if (by === 'seller') return 'người bán';
  if (by === 'admin') return 'quản trị viên';
  return 'hệ thống';
};

/** Tổng số lượng sản phẩm trong đơn. */
export const countUnits = (order: MyOrder): number => order.items.reduce((sum, i) => sum + i.quantity, 0);

export type StepState = 'done' | 'current' | 'upcoming' | 'failed';

export interface OrderStep {
  key: string;
  label: string;
  note: string;
  state: StepState;
  /** Chỉ có thời điểm ở bước đầu (API chỉ trả `createdAt`). */
  time?: string;
}

/**
 * Các mốc của thanh tiến trình:
 *  - Luồng thường: Đã xác nhận → Đang giao → Đã giao.
 *  - Đơn hủy: Đã xác nhận → Đã hủy (✗). Đơn hoàn tiền thêm mốc "Đã hoàn tiền".
 *  - Đơn hủy khi chưa thanh toán: bỏ mốc "Đã xác nhận" (chưa từng được xác nhận).
 */
export const getOrderSteps = (order: MyOrder): OrderStep[] => {
  const placedAt = formatOrderDateTime(order.createdAt);
  const { status } = order;

  if (status === 'cancelled' || status === 'refunded') {
    const wasPaid = order.paymentStatus !== 'unpaid';
    const steps: OrderStep[] = [];
    if (wasPaid) {
      steps.push({ key: 'confirmed', label: 'Đã xác nhận', note: '', state: 'done', time: placedAt });
    }
    steps.push({
      key: 'cancelled',
      label: 'Đã hủy',
      note: `Đơn hàng đã bị hủy bởi ${getCancelledByLabel(order.cancelledBy)}`,
      state: 'failed',
    });
    if (status === 'refunded') {
      steps.push({ key: 'refunded', label: 'Đã hoàn tiền', note: 'Quản trị viên đã hoàn tiền', state: 'done' });
    }
    return steps;
  }

  const rank: Record<string, number> = { pending: -1, confirmed: 0, shipping: 1, delivered: 2 };
  const reached = rank[status] ?? -1;
  const defs = [
    { key: 'confirmed', label: 'Đã xác nhận', note: status === 'pending' ? 'Đang chờ thanh toán' : '' },
    { key: 'shipping', label: 'Đang giao', note: 'Chờ người bán giao hàng' },
    { key: 'delivered', label: 'Đã giao', note: 'Chưa hoàn thành' },
  ];

  return defs.map((def, index) => {
    const state: StepState = index <= reached ? 'done' : index === reached + 1 ? 'current' : 'upcoming';
    return {
      key: def.key,
      label: def.label,
      note: state === 'done' ? '' : def.note,
      state,
      time: index === 0 && state === 'done' ? placedAt : undefined,
    };
  });
};
