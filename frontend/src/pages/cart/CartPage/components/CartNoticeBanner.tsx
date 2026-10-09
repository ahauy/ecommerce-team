import React from 'react';
import { Info, X } from 'lucide-react';

interface CartNoticeBannerProps {
  message: string;
  onDismiss: () => void;
}

/** Dải thông báo mint ở đầu trang (Giỏ hàng #2) — có thể đóng. */
const CartNoticeBanner: React.FC<CartNoticeBannerProps> = ({ message, onDismiss }) => (
  <div
    role="status"
    data-testid="cart-notice"
    className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-aloe/70 px-4 py-3 text-[11px] text-zinc-900"
  >
    <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    <p className="flex-1">{message}</p>
    <button
      type="button"
      aria-label="Đóng thông báo"
      onClick={onDismiss}
      className="rounded-full p-1 text-zinc-600 transition-colors hover:bg-white/60 hover:text-black"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  </div>
);

export default CartNoticeBanner;
