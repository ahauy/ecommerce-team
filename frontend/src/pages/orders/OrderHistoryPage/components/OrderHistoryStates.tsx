import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ShoppingBag } from 'lucide-react';
import BaseUrl from '@/consts/baseUrl';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const primaryLink =
  'inline-flex h-10 items-center justify-center rounded-full bg-black px-6 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black';

const Shell: React.FC<React.PropsWithChildren<{ testId: string }>> = ({ testId, children }) => (
  <Card
    data-testid={testId}
    className="space-y-4 px-6 py-14 text-center shadow-card"
  >
    {children}
  </Card>
);

/** Chưa có đơn nào (Đơn mua #2). Khi đang lọc theo trạng thái thì gợi ý quay lại "Tất cả". */
export const OrderHistoryEmpty: React.FC<{ filtered: boolean; onShowAll: () => void }> = ({ filtered, onShowAll }) => (
  <Shell testId="orders-empty">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
    </div>
    {filtered ? (
      <>
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold text-black">Không có đơn hàng nào ở trạng thái này</h2>
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-zinc-500">
            Hãy thử chọn trạng thái khác hoặc xem tất cả đơn hàng của bạn.
          </p>
        </div>
        <button type="button" onClick={onShowAll} className={primaryLink}>
          Xem tất cả đơn
        </button>
      </>
    ) : (
      <>
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold text-black">Bạn chưa có đơn hàng nào</h2>
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-zinc-500">
            Khám phá các sản phẩm thủ công tinh tế và bắt đầu trải nghiệm mua sắm cùng TeamShop.
          </p>
        </div>
        <Link to={BaseUrl.Homepage} className={primaryLink}>
          Mua sắm ngay
        </Link>
      </>
    )}
  </Shell>
);

export const OrderHistoryError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <Shell testId="orders-error">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
      <AlertCircle className="h-5 w-5" aria-hidden="true" />
    </div>
    <div className="space-y-1.5">
      <h2 className="text-sm font-semibold text-black">Không thể tải danh sách đơn mua</h2>
      <p className="text-xs text-zinc-500">Đã có lỗi khi kết nối tới máy chủ. Vui lòng thử lại.</p>
    </div>
    <button type="button" onClick={onRetry} className={primaryLink}>
      Thử lại
    </button>
  </Shell>
);

export const OrderHistorySkeleton: React.FC = () => (
  <div data-testid="orders-skeleton" aria-busy="true" className="space-y-5">
    {[0, 1].map((i) => (
      <Card key={i} className="space-y-4 p-6 shadow-card">
        <Skeleton className="h-4 w-40" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-8 w-full" />
      </Card>
    ))}
  </div>
);
