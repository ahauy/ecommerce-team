import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react';
import BaseUrl from '@/consts/baseUrl';

const primaryLink =
  'inline-flex h-11 items-center justify-center gap-2 rounded-full bg-black px-8 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black';

const Shell: React.FC<React.PropsWithChildren<{ testId: string }>> = ({ testId, children }) => (
  <div
    data-testid={testId}
    className="mx-auto w-full max-w-xl space-y-5 rounded-2xl border border-[#e4e4e7] bg-white px-6 py-14 text-center shadow-sm"
  >
    {children}
  </div>
);

const IconCircle: React.FC<React.PropsWithChildren<{ tone?: 'neutral' | 'danger' }>> = ({ tone = 'neutral', children }) => (
  <div
    className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
      tone === 'danger' ? 'bg-red-50 text-red-500' : 'bg-zinc-200 text-zinc-500'
    }`}
  >
    {children}
  </div>
);

/** Giỏ trống → không có gì để thanh toán. */
export const CheckoutEmptyState: React.FC = () => (
  <Shell testId="checkout-empty">
    <IconCircle>
      <ShoppingBag className="h-7 w-7" aria-hidden="true" />
    </IconCircle>
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-black">Chưa có sản phẩm để thanh toán</h2>
      <p className="mx-auto max-w-sm text-xs leading-relaxed text-zinc-500">
        Giỏ hàng của bạn đang trống. Hãy chọn vài sản phẩm rồi quay lại thanh toán nhé.
      </p>
    </div>
    <Link to={BaseUrl.Homepage} className={primaryLink}>
      Tiếp tục mua sắm
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  </Shell>
);

/** Giỏ có hàng nhưng không SP nào mua được (hết hàng / ngừng bán). */
export const CheckoutNothingPurchasable: React.FC = () => (
  <Shell testId="checkout-nothing-purchasable">
    <IconCircle tone="danger">
      <AlertCircle className="h-7 w-7" aria-hidden="true" />
    </IconCircle>
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-black">Không có sản phẩm nào có thể đặt mua</h2>
      <p className="mx-auto max-w-sm text-xs leading-relaxed text-zinc-500">
        Các sản phẩm trong giỏ đã hết hàng hoặc ngừng bán. Vui lòng điều chỉnh giỏ hàng để tiếp tục.
      </p>
    </div>
    <Link to={BaseUrl.Cart} className={primaryLink}>
      Về giỏ hàng
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  </Shell>
);

/** Admin chỉ kiểm duyệt, không mua (BR-AUTH-011). */
export const CheckoutAdminNotice: React.FC = () => (
  <Shell testId="checkout-admin-notice">
    <IconCircle>
      <ShieldCheck className="h-7 w-7" aria-hidden="true" />
    </IconCircle>
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-black">Tài khoản quản trị không đặt hàng</h2>
      <p className="mx-auto max-w-sm text-xs leading-relaxed text-zinc-500">
        Quản trị viên chỉ kiểm duyệt nội dung, không đặt mua sản phẩm.
      </p>
    </div>
    <Link to={BaseUrl.AdminCategories} className={primaryLink}>
      Về trang quản trị
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  </Shell>
);

export const CheckoutLoadError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <Shell testId="checkout-load-error">
    <IconCircle tone="danger">
      <AlertCircle className="h-7 w-7" aria-hidden="true" />
    </IconCircle>
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-black">Không thể tải trang thanh toán</h2>
      <p className="text-xs text-zinc-500">Đã có lỗi khi kết nối tới máy chủ. Vui lòng thử lại.</p>
    </div>
    <button type="button" onClick={onRetry} className={primaryLink}>
      Thử lại
    </button>
  </Shell>
);

export const CheckoutSkeleton: React.FC = () => (
  <div data-testid="checkout-skeleton" aria-busy="true" className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
    <div className="space-y-5">
      <div className="h-64 animate-pulse rounded-2xl border border-[#e4e4e7] bg-white" />
      <div className="h-80 animate-pulse rounded-2xl border border-[#e4e4e7] bg-white" />
    </div>
    <div className="h-96 animate-pulse rounded-2xl border border-[#e4e4e7] bg-white" />
  </div>
);
