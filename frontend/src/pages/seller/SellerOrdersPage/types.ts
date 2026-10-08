/**
 * Types cho trang "Đơn bán" (US-SELL-002).
 * Đơn bán dùng lại shape của đơn mua (`MyOrder`) — khớp docs/06-api-contract.md →
 * `GET /orders/selling`, `GET /orders/selling/:id`, `PATCH /orders/:id/status`.
 */
import type { MyOrder, OrderStatus } from '@/types/order-history.types';

export type SellerOrder = MyOrder;

export interface SellerOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export interface SellerOrdersResult {
  items: SellerOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Hành động của Seller trên 1 đơn (state machine: confirmed → shipping → delivered, confirmed → cancelled). */
export type SellerOrderAction = 'ship' | 'deliver' | 'cancel';

/** Body `PATCH /orders/:id/status` mà Seller được phép gửi (không có `refunded` — chỉ Admin). */
export interface UpdateOrderStatusPayload {
  status: 'shipping' | 'delivered' | 'cancelled';
  /** Bắt buộc khi `cancelled` (BR-ORD-011). */
  reason?: string;
}
