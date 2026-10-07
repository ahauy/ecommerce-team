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

/** Giỏ hàng trống (Giỏ hàng #1). */
export const CartEmptyState: React.FC = () => (
  <Shell testId="cart-empty">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-zinc-500">
      <ShoppingBag className="h-7 w-7" aria-hidden="true" />
    </div>
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-black">Giỏ hàng của bạn đang trống</h2>
      <p className="mx-auto max-w-sm text-xs leading-relaxed text-zinc-500">
        Hãy khám phá hàng trăm sản phẩm thủ công, công nghệ và phong cách sống độc bản trên TeamShop.
      </p>
    </div>
    <Link to={BaseUrl.Homepage} className={primaryLink}>
      Tiếp tục mua sắm
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  </Shell>
);

/** Admin chỉ kiểm duyệt, không mua nên không có giỏ (BR-AUTH-011). */
export const CartAdminNotice: React.FC = () => (
  <Shell testId="cart-admin-notice">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-zinc-500">
      <ShieldCheck className="h-7 w-7" aria-hidden="true" />
    </div>
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-black">Tài khoản quản trị không có giỏ hàng</h2>
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

export const CartLoadError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <Shell testId="cart-load-error">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
      <AlertCircle className="h-7 w-7" aria-hidden="true" />
    </div>
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-black">Không thể tải giỏ hàng</h2>
      <p className="text-xs text-zinc-500">Đã có lỗi khi kết nối tới máy chủ. Vui lòng thử lại.</p>
    </div>
    <button type="button" onClick={onRetry} className={primaryLink}>
      Thử lại
    </button>
  </Shell>
);

export const CartSkeleton: React.FC = () => (
  <div data-testid="cart-skeleton" aria-busy="true" className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
    <div className="space-y-5">
      {[0, 1].map((i) => (
        <div key={i} className="space-y-4 rounded-2xl border border-[#e4e4e7] bg-white p-5">
          <div className="h-4 w-40 animate-pulse rounded bg-zinc-200" />
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 animate-pulse rounded-lg bg-zinc-200" />
            <div className="h-4 flex-1 animate-pulse rounded bg-zinc-200" />
            <div className="h-8 w-24 animate-pulse rounded-full bg-zinc-200" />
          </div>
        </div>
      ))}
    </div>
    <div className="h-64 animate-pulse rounded-2xl border border-[#e4e4e7] bg-white" />
  </div>
);
