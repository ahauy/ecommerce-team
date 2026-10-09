import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, PackageX } from 'lucide-react';
import BaseUrl from '@/consts/baseUrl';

const primaryLink =
  'inline-flex h-11 items-center justify-center rounded-full bg-black px-7 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black';

const Shell: React.FC<React.PropsWithChildren<{ testId: string }>> = ({ testId, children }) => (
  <div
    data-testid={testId}
    className="space-y-4 rounded-2xl border border-hairline-light bg-white px-6 py-14 text-center shadow-card"
  >
    {children}
  </div>
);

/** URL không có `checkoutCode` (hoặc không tìm thấy giao dịch): API trả 404 cho cả "không tồn tại" lẫn "không phải của bạn". */
export const ResultNotFound: React.FC<{ reason: 'missing' | 'notFound' }> = ({ reason }) => (
  <Shell testId="result-not-found">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
      <PackageX className="h-6 w-6" aria-hidden="true" />
    </div>
    <div className="space-y-1.5">
      <h1 className="text-lg font-semibold text-black">Không tìm thấy giao dịch</h1>
      <p className="mx-auto max-w-sm text-xs leading-relaxed text-zinc-500">
        {reason === 'missing'
          ? 'Đường dẫn thiếu mã thanh toán. Bạn có thể xem các đơn hàng của mình trong mục Đơn mua.'
          : 'Giao dịch không tồn tại hoặc không thuộc tài khoản của bạn.'}
      </p>
    </div>
    <Link to={BaseUrl.AccountOrders} className={primaryLink}>
      Xem đơn mua
    </Link>
  </Shell>
);

export const ResultLoadError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <Shell testId="result-error">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
      <AlertCircle className="h-6 w-6" aria-hidden="true" />
    </div>
    <div className="space-y-1.5">
      <h1 className="text-lg font-semibold text-black">Không thể kiểm tra trạng thái thanh toán</h1>
      <p className="text-xs text-zinc-500">
        Đã có lỗi khi kết nối tới máy chủ. Nếu bạn đã thanh toán, đơn hàng vẫn được ghi nhận — hãy thử lại sau ít giây.
      </p>
    </div>
    <button type="button" onClick={onRetry} className={primaryLink}>
      Thử lại
    </button>
  </Shell>
);

export const ResultSkeleton: React.FC = () => (
  <div data-testid="result-skeleton" aria-busy="true" className="space-y-6">
    <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-zinc-200" />
    <div className="mx-auto h-9 w-72 max-w-full animate-pulse rounded bg-zinc-200" />
    <div className="h-28 animate-pulse rounded-2xl border border-hairline-light bg-white" />
  </div>
);
