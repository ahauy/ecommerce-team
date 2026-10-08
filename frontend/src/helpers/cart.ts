import type { Cart, CartGroup, CartItem, CartItemStatus, CartProduct, CartSeller } from '@/types/cart.types';

/** BR-CART-009: giỏ tối đa 100 SP khác nhau. */
export const MAX_CART_PRODUCTS = 100;

/** Gian hàng "không xác định" — dùng cho SP guest không còn xem được (404). */
export const UNKNOWN_SELLER_ID = 'unknown';

export const EMPTY_CART: Cart = { groups: [], totalAmount: 0 };

interface StatusInput {
  stock: number;
  quantity: number;
  isActive: boolean;
  isBlocked: boolean;
}

/** Quy tắc trạng thái item (BR-CART-003, BR-CART-004) — cùng logic với `GET /cart` của BE. */
export const resolveItemStatus = ({ stock, quantity, isActive, isBlocked }: StatusInput): CartItemStatus => {
  if (!isActive || isBlocked) return 'unavailable';
  if (stock <= 0) return 'out_of_stock';
  if (quantity > stock) return 'exceeds_stock';
  return 'available';
};

export interface CartEntry {
  seller: CartSeller;
  product: CartProduct;
  quantity: number;
  status: CartItemStatus;
}

/**
 * Dựng giỏ hàng nhóm theo người bán từ danh sách item (dùng cho giỏ Guest ở client).
 * Nhóm theo thứ tự xuất hiện của item đầu tiên; chỉ item `available` được cộng tiền.
 */
export const buildCart = (entries: CartEntry[]): Cart => {
  const byseller = new Map<string, CartGroup>();

  entries.forEach(({ seller, product, quantity, status }) => {
    const item: CartItem = { product, quantity, status, lineTotal: product.price * quantity };
    let group = byseller.get(seller.id);
    if (!group) {
      group = { seller, items: [], subtotal: 0 };
      byseller.set(seller.id, group);
    }
    group.items.push(item);
    if (status === 'available') group.subtotal += item.lineTotal;
  });

  const groups = Array.from(byseller.values());
  return { groups, totalAmount: groups.reduce((sum, g) => sum + g.subtotal, 0) };
};

/** Số item mua được của 1 gian hàng. */
export const countPurchasable = (group: CartGroup): number =>
  group.items.filter((item) => item.status === 'available').length;

export interface CartStats {
  /** Số SP khác nhau trong giỏ (hiển thị "3 sản phẩm" & badge). */
  productCount: number;
  /** Số SP mua được (`available`). */
  purchasableCount: number;
  /** Số SP không mua được (hết hàng / ngừng bán / vượt tồn kho). */
  unavailableCount: number;
  /** Số gian hàng có ít nhất 1 SP mua được = số Order sẽ được tách ra khi checkout. */
  orderCount: number;
}

export const getCartStats = (cart: Cart): CartStats => {
  let productCount = 0;
  let purchasableCount = 0;
  let orderCount = 0;

  cart.groups.forEach((group) => {
    const purchasable = countPurchasable(group);
    productCount += group.items.length;
    purchasableCount += purchasable;
    if (purchasable > 0) orderCount += 1;
  });

  return { productCount, purchasableCount, unavailableCount: productCount - purchasableCount, orderCount };
};

/** Nhãn trạng thái hiển thị cho item không mua được (khớp bảng trong API contract). */
export const getStatusLabel = (status: CartItemStatus, stock: number): string | null => {
  switch (status) {
    case 'exceeds_stock':
      return `Chỉ còn ${stock} sản phẩm`;
    case 'out_of_stock':
      return 'Hết hàng';
    case 'unavailable':
      return 'Sản phẩm ngừng bán';
    default:
      return null;
  }
};
