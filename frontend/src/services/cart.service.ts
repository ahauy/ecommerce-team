import { apiClient } from '@/services/apiClient';
import type {
  Cart,
  CartGroup,
  CartItem,
  CartItemStatus,
  CartLine,
  CartProduct,
} from '@/types/cart.types';

type Raw = Record<string, unknown>;

const asString = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);
const asNumber = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const asRecord = (v: unknown): Raw | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : null;
const asArray = (v: unknown): Raw[] =>
  Array.isArray(v) ? v.map(asRecord).filter((r): r is Raw => r !== null) : [];

const STATUSES: CartItemStatus[] = ['available', 'exceeds_stock', 'out_of_stock', 'unavailable'];
/** Trạng thái lạ → coi như không mua được (an toàn hơn là cho mua). */
const asStatus = (v: unknown): CartItemStatus =>
  STATUSES.includes(v as CartItemStatus) ? (v as CartItemStatus) : 'unavailable';

const normalizeProduct = (raw: Raw): CartProduct => ({
  id: asString(raw.id) ?? asString(raw._id) ?? '',
  name: asString(raw.name) ?? '',
  slug: asString(raw.slug),
  imageUrl: asString(raw.imageUrl),
  price: asNumber(raw.price),
  stock: asNumber(raw.stock),
});

const normalizeItem = (raw: Raw): CartItem => {
  const product = normalizeProduct(asRecord(raw.product) ?? {});
  const quantity = asNumber(raw.quantity);
  return {
    product,
    quantity,
    status: asStatus(raw.status),
    lineTotal: asNumber(raw.lineTotal, product.price * quantity),
  };
};

const normalizeGroup = (raw: Raw): CartGroup => {
  const seller = asRecord(raw.seller) ?? {};
  return {
    seller: {
      id: asString(seller.id) ?? asString(seller._id) ?? '',
      shopName: asString(seller.shopName),
    },
    items: asArray(raw.items).map(normalizeItem),
    subtotal: asNumber(raw.subtotal),
  };
};

/** Chuẩn hoá phản hồi của mọi endpoint `/cart/*` (đều trả toàn bộ giỏ cùng định dạng). */
export const normalizeCart = (raw: Raw | null | undefined): Cart => ({
  groups: asArray(raw?.groups).map(normalizeGroup),
  totalAmount: asNumber(raw?.totalAmount),
});

/** Customer — giỏ lưu DB. Guest không gọi các endpoint này (giỏ nằm ở localStorage). */
export const cartService = {
  /** `GET /cart` — giỏ đã nhóm theo người bán. */
  getCart: async (): Promise<Cart> => {
    const res = await apiClient.get<Raw>('/cart');
    return normalizeCart(res.data);
  },

  /** `POST /cart/items` — thêm SP (đã có thì cộng dồn). */
  addItem: async (productId: string, quantity: number): Promise<Cart> => {
    const res = await apiClient.post<Raw>('/cart/items', { productId, quantity });
    return normalizeCart(res.data);
  },

  /** `PATCH /cart/items/:productId` — đặt lại số lượng (≤ stock). */
  updateItem: async (productId: string, quantity: number): Promise<Cart> => {
    const res = await apiClient.patch<Raw>(`/cart/items/${productId}`, { quantity });
    return normalizeCart(res.data);
  },

  /** `DELETE /cart/items/:productId` — idempotent. */
  removeItem: async (productId: string): Promise<Cart> => {
    const res = await apiClient.delete<Raw>(`/cart/items/${productId}`);
    return normalizeCart(res.data);
  },

  /** `DELETE /cart` — xoá toàn bộ giỏ. */
  clear: async (): Promise<Cart> => {
    const res = await apiClient.delete<Raw>('/cart');
    return normalizeCart(res.data);
  },

  /** `POST /cart/merge` — gộp giỏ localStorage vào DB sau đăng nhập (BR-CART-002, BR-CART-008). */
  merge: async (items: CartLine[]): Promise<Cart> => {
    const res = await apiClient.post<Raw>('/cart/merge', { items });
    return normalizeCart(res.data);
  },
};

export default cartService;
