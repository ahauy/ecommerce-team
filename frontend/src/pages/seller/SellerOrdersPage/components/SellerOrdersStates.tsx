import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, Info, RefreshCw, ShoppingBag } from 'lucide-react';
import BaseUrl from '@/consts/baseUrl';

const primaryBtn =
  'inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-black px-6 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black';
const outlineBtn =
  'inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#e4e4e7] bg-white px-5 text-xs font-semibold text-black transition-colors hover:border-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black';

const Shell: React.FC<React.PropsWithChildren<{ testId: string }>> = ({ testId, children }) => (
  <div
    data-testid={testId}
    className="space-y-4 rounded-2xl border border-[#e4e4e7] bg-white px-6 py-14 text-center shadow-card"
  >
    {children}
  </div>
);

/** Shop chưa có đơn nào (Đơn bán #4) — kèm mẹo kích hoạt đơn đầu tiên. */
export const SellerOrdersEmpty: React.FC<{ onReload: () => void; reloading?: boolean }> = ({ onReload, reloading }) => (
  <Shell testId="seller-orders-empty">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#e4e4e7] bg-[#fbfbf5] text-zinc-500">
      <ShoppingBag className="h-6 w-6" aria-hidden="true" />
    </div>
    <div className="space-y-1.5">
      <h2 className="text-base font-semibold text-black">Chưa có đơn hàng nào</h2>
      <p className="mx-auto max-w-md text-xs leading-relaxed text-zinc-500">
        Đơn hàng sẽ xuất hiện ở đây khi có người mua sản phẩm của bạn. Hãy đảm bảo danh mục hàng hóa của bạn luôn đầy
        đủ hình ảnh và thông tin chi tiết.
      </p>
    </div>

    <div className="mx-auto flex max-w-md items-start gap-3 rounded-xl border border-[#e4e4e7] bg-[#fbfbf5] px-4 py-3 text-left">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0f5132]" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs font-semibold text-black">Mẹo kích hoạt đơn hàng đầu tiên</p>
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Chia sẻ liên kết cửa hàng hoặc cập nhật ít nhất 3 sản phẩm có hình ảnh sắc nét.
        </p>
      </div>
      <Link to={BaseUrl.ShopSetup} className="shrink-0 text-[11px] font-semibold text-black underline underline-offset-2">
        Cài đặt gian hàng
      </Link>
    </div>

    <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
      <button type="button" onClick={onReload} disabled={reloading} className={outlineBtn}>
        <RefreshCw className={reloading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} aria-hidden="true" />
        Tải lại trang
      </button>
      <Link to={BaseUrl.SellerProductCreate} className={primaryBtn}>
        Đăng sản phẩm mới
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  </Shell>
);

/** Có đơn nhưng không khớp bộ lọc trạng thái / từ khoá tìm kiếm. */
export const SellerOrdersFilteredEmpty: React.FC<{ searching: boolean; onReset: () => void }> = ({
  searching,
  onReset,
}) => (
  <Shell testId="seller-orders-filtered-empty">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
    </div>
    <div className="space-y-1.5">
      <h2 className="text-sm font-semibold text-black">
        {searching ? 'Không tìm thấy đơn hàng phù hợp' : 'Không có đơn hàng nào ở trạng thái này'}
      </h2>
      <p className="mx-auto max-w-sm text-xs leading-relaxed text-zinc-500">
        {searching
          ? 'Hãy kiểm tra lại mã đơn hoặc tên người mua. Tìm kiếm chỉ áp dụng cho các đơn đang hiển thị ở trang này.'
          : 'Hãy thử chọn trạng thái khác hoặc xem tất cả đơn bán của gian hàng.'}
      </p>
    </div>
    <button type="button" onClick={onReset} className={primaryBtn}>
      {searching ? 'Xóa tìm kiếm' : 'Xem tất cả đơn'}
    </button>
  </Shell>
);

export const SellerOrdersError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <Shell testId="seller-orders-error">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
      <AlertCircle className="h-5 w-5" aria-hidden="true" />
    </div>
    <div className="space-y-1.5">
      <h2 className="text-sm font-semibold text-black">Không thể tải danh sách đơn bán</h2>
      <p className="text-xs text-zinc-500">Đã có lỗi khi kết nối tới máy chủ. Vui lòng thử lại.</p>
    </div>
    <button type="button" onClick={onRetry} className={primaryBtn}>
      Thử lại
    </button>
  </Shell>
);

export const SellerOrdersSkeleton: React.FC = () => (
  <div data-testid="seller-orders-skeleton" aria-busy="true" className="space-y-5">
    {[0, 1].map((i) => (
      <div key={i} className="space-y-4 rounded-2xl border border-[#e4e4e7] bg-white p-6">
        <div className="h-4 w-48 animate-pulse rounded bg-zinc-200" />
        <div className="grid gap-4 md:grid-cols-[2fr_3fr]">
          <div className="space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-zinc-200" />
            <div className="h-3 w-56 animate-pulse rounded bg-zinc-100" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-lg bg-zinc-200" />
            <div className="h-4 flex-1 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-zinc-200" />
          </div>
        </div>
        <div className="h-8 w-full animate-pulse rounded bg-zinc-100" />
      </div>
    ))}
  </div>
);
