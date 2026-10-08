/**
 * Types giỏ hàng (US-CART-001).
 * Khớp với docs/06-api-contract.md → "Cart — /api/v1/cart".
 */

/** Trạng thái 1 item trong giỏ — chỉ `available` mới mua được & được cộng tiền. */
export type CartItemStatus = 'available' | 'exceeds_stock' | 'out_of_stock' | 'unavailable';

/** Dòng giỏ hàng lưu ở localStorage (Guest) / gửi lên `POST /cart/merge` (BR-CART-001). */
export interface CartLine {
  productId: string;
  quantity: number;
}

export interface CartProduct {
  id: string;
  name: string;
  slug: string | null;
  imageUrl: string | null;
  /** Luôn là giá hiện tại (BR-CART-007). */
  price: number;
  stock: number;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
  status: CartItemStatus;
  /** price × quantity (item không `available` vẫn có lineTotal nhưng không được cộng vào tổng). */
  lineTotal: number;
}

export interface CartSeller {
  id: string;
  shopName: string | null;
}

/** Các item của cùng 1 người bán (BR-CART-005). */
export interface CartGroup {
  seller: CartSeller;
  items: CartItem[];
  /** Chỉ cộng các item `available`. */
  subtotal: number;
}

export interface Cart {
  groups: CartGroup[];
  /** Chỉ cộng các item `available`. */
  totalAmount: number;
}
