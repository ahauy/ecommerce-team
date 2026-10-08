import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, PackageX } from 'lucide-react';
import BaseUrl from '@/consts/baseUrl';

const primaryLink =
  'inline-flex h-10 items-center justify-center rounded-full bg-black px-6 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black';

const Shell: React.FC<React.PropsWithChildren<{ testId: string }>> = ({ testId, children }) => (
  <div
    data-testid={testId}
    className="space-y-4 rounded-2xl border border-[#e4e4e7] bg-white px-6 py-14 text-center shadow-card"
  >
    {children}
  </div>
);

/** Đơn không tồn tại hoặc của người khác (BE trả 404 — không lộ sự tồn tại). */
export const OrderNotFound: React.FC = () => (
  <Shell testId="order-not-found">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
      <PackageX className="h-5 w-5" aria-hidden="true" />
    </div>
    <div className="space-y-1.5">
      <h2 className="text-sm font-semibold text-black">Không tìm thấy đơn hàng</h2>
      <p className="text-xs text-zinc-500">Đơn hàng không tồn tại hoặc không thuộc tài khoản của bạn.</p>
    </div>
    <Link to={BaseUrl.AccountOrders} className={primaryLink}>
      Về danh sách đơn mua
    </Link>
  </Shell>
);

export const OrderDetailError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <Shell testId="order-detail-error">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
      <AlertCircle className="h-5 w-5" aria-hidden="true" />
    </div>
    <div className="space-y-1.5">
      <h2 className="text-sm font-semibold text-black">Không thể tải chi tiết đơn hàng</h2>
      <p className="text-xs text-zinc-500">Đã có lỗi khi kết nối tới máy chủ. Vui lòng thử lại.</p>
    </div>
    <button type="button" onClick={onRetry} className={primaryLink}>
      Thử lại
    </button>
  </Shell>
);

export const OrderDetailSkeleton: React.FC = () => (
  <div data-testid="order-detail-skeleton" aria-busy="true" className="space-y-5">
    <div className="h-8 w-72 animate-pulse rounded bg-zinc-200" />
    <div className="h-28 animate-pulse rounded-2xl border border-[#e4e4e7] bg-white" />
    <div className="grid gap-4 md:grid-cols-2">
      <div className="h-32 animate-pulse rounded-2xl border border-[#e4e4e7] bg-white" />
      <div className="h-32 animate-pulse rounded-2xl border border-[#e4e4e7] bg-white" />
    </div>
    <div className="h-56 animate-pulse rounded-2xl border border-[#e4e4e7] bg-white" />
  </div>
);
