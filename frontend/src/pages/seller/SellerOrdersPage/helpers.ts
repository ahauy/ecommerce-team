import type { OrderPaymentStatus, OrderStatus } from '@/types/order-history.types';
import type { SellerOrder, SellerOrderAction, UpdateOrderStatusPayload } from './types';

export const SELLER_ORDERS_PAGE_SIZE = 10;

/**
 * Các nút Seller được bấm theo trạng thái hiện tại (khớp state machine ở BE):
 *  - confirmed → Hủy đơn (kèm lý do) hoặc Giao hàng
 *  - shipping  → Đã giao
 *  - còn lại (pending / delivered / cancelled / refunded) → không có hành động.
 * Thứ tự trong mảng = thứ tự hiển thị từ trái sang phải.
 */
export const getAvailableActions = (status: OrderStatus): SellerOrderAction[] => {
  if (status === 'confirmed') return ['cancel', 'ship'];
  if (status === 'shipping') return ['deliver'];
  return [];
};

export const ACTION_LABEL: Record<SellerOrderAction, string> = {
  ship: 'Giao hàng',
  deliver: 'Đã giao',
  cancel: 'Hủy đơn',
};

export const buildStatusPayload = (action: SellerOrderAction, reason?: string): UpdateOrderStatusPayload => {
  if (action === 'ship') return { status: 'shipping' };
  if (action === 'deliver') return { status: 'delivered' };
  return { status: 'cancelled', reason: (reason ?? '').trim() };
};

export const ACTION_SUCCESS_MESSAGE: Record<SellerOrderAction, (code: string) => string> = {
  ship: (code) => `Đã chuyển đơn #${code} sang trạng thái Đang giao`,
  deliver: (code) => `Đơn #${code} đã được đánh dấu là Đã giao`,
  cancel: (code) => `Đã hủy đơn #${code}`,
};

/** Tìm theo mã đơn hoặc tên người mua (người nhận) — lọc ở client trên trang đang xem. */
export const matchesOrderSearch = (order: SellerOrder, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    order.orderCode.toLowerCase().includes(q) ||
    (order.recipient?.fullName ?? '').toLowerCase().includes(q)
  );
};

export const PAYMENT_BADGE_CLASS: Record<OrderPaymentStatus, string> = {
  paid: 'bg-[#c1fbd4] text-[#0f5132]',
  unpaid: 'bg-zinc-100 text-zinc-600',
  refunded: 'bg-zinc-200 text-zinc-700',
};
