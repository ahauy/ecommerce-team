/**
 * Types cho trang kết quả thanh toán `/checkout/result` (US-PAY-001).
 * Khớp docs/06-api-contract.md → `GET /checkouts/:checkoutCode`.
 */
import type { OrderStatus } from '@/types/order-history.types';

/** Trạng thái 1 lần thanh toán (Checkout). */
export type CheckoutPaymentStatus = 'pending' | 'paid' | 'failed' | 'expired';

export interface CheckoutResultItem {
  name: string;
  quantity: number;
}

/** 1 đơn con (mỗi gian hàng 1 đơn) của Checkout. */
export interface CheckoutResultOrder {
  /** API tối thiểu chỉ trả `orderCode`; nếu BE bổ sung `id` thì link thẳng tới chi tiết đơn. */
  id: string | null;
  orderCode: string;
  shopName: string | null;
  totalAmount: number;
  status: OrderStatus;
  /** Tuỳ chọn — chỉ có khi BE trả `items`. */
  items: CheckoutResultItem[];
}

export interface CheckoutResult {
  checkoutCode: string;
  status: CheckoutPaymentStatus;
  totalAmount: number;
  orders: CheckoutResultOrder[];
}
