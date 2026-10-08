import React from 'react';
import { ArrowRight, Info, ShieldCheck } from 'lucide-react';
import { countPurchasable } from '@/helpers/cart';
import { formatVnd } from '@/helpers/format';
import type { Cart } from '@/types/cart.types';

interface CartSummaryProps {
  cart: Cart;
  /** Số Order sẽ được tách ra = số gian hàng có SP mua được. */
  orderCount: number;
  isGuest: boolean;
  onCheckout: () => void;
}

/** Cột "Tóm tắt đơn hàng" bên phải (sticky trên desktop). */
const CartSummary: React.FC<CartSummaryProps> = ({ cart, orderCount, isGuest, onCheckout }) => {
  const purchasableGroups = cart.groups.filter((g) => countPurchasable(g) > 0);
  const canCheckout = purchasableGroups.length > 0;

  return (
    <aside
      data-testid="cart-summary"
      aria-label="Tóm tắt đơn hàng"
      className="space-y-5 rounded-2xl border border-[#e4e4e7] bg-white p-5 shadow-sm lg:sticky lg:top-24"
    >
      <h2 className="text-sm font-semibold text-black">Tóm tắt đơn hàng</h2>

      {canCheckout && (
        <ul className="space-y-2.5">
          {purchasableGroups.map((group) => (
            <li key={group.seller.id} className="flex items-center justify-between gap-3 text-[11px] text-zinc-600">
              <span className="min-w-0 truncate">
                {group.seller.shopName ?? 'Gian hàng khác'} ({countPurchasable(group)} sản phẩm)
              </span>
              <span className="shrink-0 font-medium text-black">{formatVnd(group.subtotal)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end justify-between gap-3 border-t border-[#f0f0f2] pt-4">
        <span className="text-xs font-medium text-black">Tổng cộng</span>
        <span data-testid="cart-total" className="text-xl font-bold leading-none text-black">
          {formatVnd(cart.totalAmount)}
        </span>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-[#c1fbd4]/60 px-3 py-2.5 text-[11px] leading-relaxed text-zinc-800">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <p data-testid="cart-split-note">
          {!canCheckout
            ? 'Chưa có sản phẩm nào có thể đặt hàng. Hãy điều chỉnh số lượng hoặc xóa sản phẩm không còn bán.'
            : orderCount > 1
              ? `Đơn hàng sẽ được tách thành ${orderCount} đơn theo gian hàng, thanh toán một lần qua VNPay.`
              : 'Đơn hàng được thanh toán một lần qua VNPay.'}
        </p>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        disabled={!canCheckout}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-black text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:hover:bg-zinc-300"
      >
        Tiến hành đặt hàng
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>

      {isGuest && canCheckout && (
        <p className="text-center text-[11px] text-zinc-500">Bạn cần đăng nhập để đặt hàng.</p>
      )}

      <p className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400">
        <ShieldCheck className="h-3 w-3" aria-hidden="true" />
        Thanh toán an toàn qua VNPay
      </p>
    </aside>
  );
};

export default CartSummary;
