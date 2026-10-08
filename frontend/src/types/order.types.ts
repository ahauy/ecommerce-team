/**
 * Types Order & Checkout (US-ORD-001).
 * Khớp với docs/06-api-contract.md → "Order & Checkout — /api/v1/orders".
 */

/** Thông tin người nhận — dùng chung cho mọi Order con của 1 Checkout (BR-CHK-006). */
export interface CheckoutRecipient {
  fullName: string;
  phone: string;
  address: string;
  /** Không bắt buộc: BE lấy email từ tài khoản nếu bỏ trống. */
  email?: string;
}

/** Dòng gửi lên `POST /orders` — KHÔNG gửi price / sellerId (BR-CHK-003). */
export interface CheckoutLine {
  productId: string;
  quantity: number;
}

export interface CreateCheckoutPayload {
  recipient: CheckoutRecipient;
  items: CheckoutLine[];
}

export interface CheckoutOrderSummary {
  orderId: string;
  orderCode: string;
  seller: { id: string; shopName: string | null };
  totalAmount: number;
}

/** Phản hồi 201 của `POST /orders`. */
export interface CreateCheckoutResult {
  checkoutId: string;
  checkoutCode: string;
  totalAmount: number;
  /** ISO — hạn thanh toán (30 phút kể từ lúc tạo, BR-CHK-005). */
  expiresAt: string;
  orders: CheckoutOrderSummary[];
  /** `checkoutUrl` của PayOS — FE redirect tới đây để thanh toán (BR-PAY-001). */
  paymentUrl: string;
}

/** 1 SP thiếu hàng trong lỗi 400 của `POST /orders` (BR-CHK-002). */
export interface StockShortage {
  productId: string;
  name: string;
  available: number;
  requested: number;
}
