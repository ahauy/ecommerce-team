import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Clock, Loader2, Lock, Receipt, ShieldCheck } from 'lucide-react';
import BaseUrl from '@/consts/baseUrl';
import { CHECKOUT_HOLD_MINUTES } from '@/helpers/checkout';
import { countPurchasable } from '@/helpers/cart';
import { formatVnd } from '@/helpers/format';
import type { Cart } from '@/types/cart.types';

interface CheckoutSummaryProps {
  cart: Cart;
  /** Số Order sẽ được tách = số gian hàng (BR-CHK-001). */
  orderCount: number;
  /** Có cảnh báo tồn kho → khóa thanh toán, đổi nút chính thành "Cập nhật lại giỏ hàng". */
  blocked: boolean;
  /** Chưa thể đặt vì lý do khác (đang sửa địa chỉ, thông tin nhận hàng chưa hợp lệ). */
  disabledReason: string | null;
  submitting: boolean;
  onPay: () => void;
}

const primaryBtn =
  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-black text-sm font-semibold text-white transition-all duration-150 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:hover:bg-zinc-300';

/** Cột phải "Tóm tắt đơn hàng": tổng tiền · PayOS · nút thanh toán. */
const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  cart,
  orderCount,
  blocked,
  disabledReason,
  submitting,
  onPay,
}) => (
  <aside
    data-testid="checkout-summary"
    aria-label="Tóm tắt đơn hàng"
    className="space-y-5 rounded-2xl border border-hairline-light bg-white p-5 shadow-card lg:sticky lg:top-6"
  >
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-black">{blocked ? 'Tóm tắt thanh toán' : 'Tóm tắt đơn hàng'}</h2>
      {!blocked && <Receipt className="h-4 w-4 text-zinc-400" aria-hidden="true" />}
    </div>

    {!blocked && (
      <>
        <ul className="space-y-2.5">
          {cart.groups.map((group) => (
            <li key={group.seller.id} className="flex items-center justify-between gap-3 text-[11px] text-zinc-600">
              <span className="min-w-0 truncate">
                {group.seller.shopName ?? 'Gian hàng khác'} (<span className="tabular-nums">{countPurchasable(group)}</span> sản phẩm)
              </span>
              <span className="shrink-0 font-medium text-black tabular-nums">{formatVnd(group.subtotal)}</span>
            </li>
          ))}
        </ul>
        {orderCount > 1 && (
          <p data-testid="checkout-split-note" className="flex items-center gap-1.5 border-t border-hairline-light pt-3 text-[11px] text-zinc-500">
            <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
            Đơn hàng sẽ được tách thành <span className="tabular-nums">{orderCount}</span> đơn theo gian hàng
          </p>
        )}
      </>
    )}

    <div className="flex items-end justify-between gap-3 border-t border-hairline-light pt-4">
      <span className="text-xs font-medium text-black">{blocked ? 'Tổng cộng' : 'Tổng thanh toán'}</span>
      <span data-testid="checkout-total" className="text-2xl font-bold leading-none text-black tabular-nums">
        {formatVnd(cart.totalAmount)}
      </span>
    </div>
    {!blocked && <p className="-mt-3 text-[10px] text-zinc-400">Đã bao gồm tất cả chi phí sản phẩm</p>}

    <div className="space-y-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Phương thức thanh toán</p>
      {blocked ? (
        <div className="flex items-center gap-3 rounded-lg border border-hairline-light bg-[#f6f6f1] px-3 py-2.5 opacity-80">
          <span className="text-[10px] font-bold text-zinc-500">PAYOS</span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-zinc-700">Cổng PayOS (QR / VietQR)</p>
            <p className="text-[10px] text-zinc-500">Tạm hoãn do tồn kho chưa khớp</p>
          </div>
          <Lock className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border-2 border-emerald-700/70 bg-emerald-50/40 px-3 py-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded border border-hairline-light bg-white text-[8px] font-extrabold text-blue-700">
            PAYOS
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-black">PayOS</p>
            <p className="text-[10px] text-zinc-500">Thanh toán qua cổng PayOS</p>
          </div>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-800 text-white">
            <Check className="h-3 w-3" aria-hidden="true" />
          </span>
        </div>
      )}
    </div>

    <div className="flex items-start gap-2 rounded-lg bg-aloe/60 px-3 py-2.5 text-[11px] leading-relaxed text-zinc-800">
      <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <p>
        {blocked
          ? `Đơn hàng được giữ trong ${CHECKOUT_HOLD_MINUTES} phút để bạn thanh toán.`
          : `Sau khi đặt hàng, đơn được giữ ${CHECKOUT_HOLD_MINUTES} phút để bạn hoàn tất thanh toán qua PayOS.`}
      </p>
    </div>

    {blocked ? (
      <div className="space-y-3">
        <button type="button" disabled className={`${primaryBtn} !bg-zinc-200 !text-zinc-500`}>
          Thanh toán với PayOS
        </button>
        <Link to={BaseUrl.Cart} className={primaryBtn}>
          Cập nhật lại giỏ hàng
        </Link>
        <p role="alert" className="text-center text-[11px] font-medium text-red-600">
          Vui lòng giải quyết cảnh báo tồn kho trước khi thanh toán.
        </p>
      </div>
    ) : (
      <div className="space-y-2">
        <button type="button" onClick={onPay} disabled={!!disabledReason || submitting} className={primaryBtn}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Đang chuyển tới PayOS...
            </>
          ) : (
            <>
              Thanh toán với PayOS
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
        {disabledReason && !submitting && (
          <p data-testid="checkout-disabled-reason" className="text-center text-[11px] text-zinc-500">
            {disabledReason}
          </p>
        )}
        <p className="flex items-center justify-center gap-1.5 pt-1 text-[10px] text-zinc-400">
          <ShieldCheck className="h-3 w-3" aria-hidden="true" />
          Thanh toán an toàn, bảo mật qua cổng PayOS
        </p>
      </div>
    )}
  </aside>
);

export default CheckoutSummary;
