import type { Cart, CartGroup, CartItem } from '@/types/cart.types';
import type { CheckoutLine, StockShortage } from '@/types/order.types';

/** Thời gian giữ hàng sau khi đặt (BR-CHK-005) — chỉ để hiển thị. */
export const CHECKOUT_HOLD_MINUTES = 30;

/** Item không mua được (hết hàng / ngừng bán / vượt tồn kho) kèm shop để hiển thị cảnh báo. */
export interface CheckoutIssue {
  productId: string;
  name: string;
  shopName: string;
  requested: number;
  /** Số còn lại trong kho; `null` = ngừng bán. */
  available: number | null;
}

/** Cảnh báo tồn kho từ giỏ hiện tại (tồn kho FE thấy). */
export const getCartIssues = (cart: Cart): CheckoutIssue[] =>
  cart.groups.flatMap((group) =>
    group.items
      .filter((item) => item.status !== 'available')
      .map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        shopName: group.seller.shopName ?? 'Gian hàng khác',
        requested: item.quantity,
        available: item.status === 'unavailable' ? null : item.product.stock,
      }))
  );

/** Cảnh báo từ lỗi 400 của BE (tồn kho có thể vừa đổi sau khi trang đã tải). */
export const shortagesToIssues = (cart: Cart, shortages: StockShortage[]): CheckoutIssue[] => {
  const shopByProduct = new Map<string, string>();
  cart.groups.forEach((g) =>
    g.items.forEach((i) => shopByProduct.set(i.product.id, g.seller.shopName ?? 'Gian hàng khác'))
  );
  return shortages.map((s) => ({
    productId: s.productId,
    name: s.name,
    shopName: shopByProduct.get(s.productId) ?? 'Gian hàng khác',
    requested: s.requested,
    available: s.available,
  }));
};

/** Gộp 2 nguồn cảnh báo, ưu tiên bản mới nhất từ BE theo `productId`. */
export const mergeIssues = (fromCart: CheckoutIssue[], fromServer: CheckoutIssue[]): CheckoutIssue[] => {
  const map = new Map<string, CheckoutIssue>();
  fromCart.forEach((i) => map.set(i.productId, i));
  fromServer.forEach((i) => map.set(i.productId, i));
  return Array.from(map.values());
};

/** Mô tả 1 cảnh báo: "Bạn yêu cầu 2 sản phẩm, hiện chỉ còn 1 sản phẩm." */
export const describeIssue = (issue: CheckoutIssue): string => {
  if (issue.available === null) return 'Sản phẩm đã ngừng bán.';
  if (issue.available <= 0) return 'Sản phẩm đã hết hàng.';
  return `Bạn yêu cầu ${issue.requested} sản phẩm, hiện chỉ còn ${issue.available} sản phẩm.`;
};

/** Item đủ điều kiện đặt: gửi `productId` + `quantity` — giá/seller do server lấy từ DB (BR-CHK-003). */
export const toCheckoutLines = (cart: Cart): CheckoutLine[] =>
  cart.groups.flatMap((g) =>
    g.items.filter((i) => i.status === 'available').map((i) => ({ productId: i.product.id, quantity: i.quantity }))
  );

export const countCheckoutProducts = (cart: Cart): number =>
  cart.groups.reduce((sum, g) => sum + g.items.length, 0);

export const itemHasIssue = (item: CartItem, issueIds: Set<string>): boolean =>
  item.status !== 'available' || issueIds.has(item.product.id);

export const groupHasItems = (group: CartGroup): boolean => group.items.length > 0;

/** Chuyển trình duyệt sang trang thanh toán (PayOS `paymentUrl`) (tách riêng để test mock được `window.location`). */
export const redirectToPayment = (url: string): void => {
  window.location.assign(url);
};
