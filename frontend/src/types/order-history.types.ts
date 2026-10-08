/**
 * Types cho "Đơn mua" (US-ORD-002) — lịch sử & chi tiết đơn của người mua.
 * Khớp docs/06-api-contract.md → `GET /orders/my`, `GET /orders/my/:id`.
 */

export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled' | 'refunded';

export type OrderPaymentStatus = 'unpaid' | 'paid' | 'refunded';

export type OrderCancelledBy = 'system' | 'seller' | 'admin';

/** Snapshot 1 dòng sản phẩm tại thời điểm đặt hàng. */
export interface OrderLineItem {
  productId: string | null;
  name: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
}

/** Snapshot người nhận (chỉ có ở API chi tiết). */
export interface OrderRecipientInfo {
  fullName: string;
  phone: string;
  email: string | null;
  address: string;
}

/** 1 đơn mua — dùng chung cho danh sách và chi tiết (danh sách có thể không có `recipient`). */
export interface MyOrder {
  id: string;
  orderCode: string;
  checkoutCode: string;
  seller: { id: string; shopName: string | null };
  items: OrderLineItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  /** vd. 'payos' */
  paymentMethod: string | null;
  recipient: OrderRecipientInfo | null;
  cancelReason: string | null;
  cancelledBy: OrderCancelledBy | null;
  createdAt: string;
  updatedAt: string | null;
}

/** Tham số `GET /orders/my`. */
export interface MyOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export interface MyOrdersResult {
  items: MyOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
