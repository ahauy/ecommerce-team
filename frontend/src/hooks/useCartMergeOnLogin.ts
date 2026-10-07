import { useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';
import { cartService } from '@/services/cart.service';
import { CART_KEYS } from '@/hooks/queries/useCart';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { getHttpStatus } from '@/helpers/format';

/** Đang merge dở: chặn effect chạy lại (React StrictMode) gộp trùng → cộng dồn số lượng 2 lần. */
let inFlight: Promise<void> | null = null;

const mergeGuestCart = async (userId: string): Promise<void> => {
  const lines = useCartStore.getState().items;
  if (lines.length === 0) return;

  const payload = lines.map(({ productId, quantity }) => ({ productId, quantity }));
  try {
    let cart;
    try {
      cart = await cartService.merge(payload);
    } catch (error) {
      // 409: giỏ vừa được cập nhật ở nơi khác (vd. 2 tab) → thử lại 1 lần.
      if (getHttpStatus(error) !== 409) throw error;
      cart = await cartService.merge(payload);
    }
    // Chỉ bỏ những dòng đã gửi — dòng Guest thêm trong lúc đang merge (nếu có) được giữ lại.
    const sent = new Set(payload.map((l) => l.productId));
    useCartStore.setState((state) => ({ items: state.items.filter((i) => !sent.has(i.productId)) }));
    queryClient.setQueryData(CART_KEYS.customer(userId), cart);
  } catch {
    // Merge thất bại → giữ nguyên localStorage để merge lại ở lần mở app / đăng nhập sau (không mất hàng của khách).
  }
};

/**
 * BR-CART-002: ngay khi Customer đăng nhập (hoặc phiên được khôi phục), gộp giỏ localStorage
 * vào giỏ DB bằng `POST /cart/merge`, rồi mới xoá localStorage.
 *
 * Gắn 1 lần ở `App` (ngoài mọi trang) nên không phải sửa từng trang đăng nhập.
 */
export const useCartMergeOnLogin = () => {
  const status = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const role = useAuthStore((s) => s.user?.role);

  useEffect(() => {
    if (status !== 'authed' || role !== 'customer' || !userId || inFlight) return;

    inFlight = mergeGuestCart(userId).finally(() => {
      inFlight = null;
    });
  }, [status, role, userId]);
};

export default useCartMergeOnLogin;
