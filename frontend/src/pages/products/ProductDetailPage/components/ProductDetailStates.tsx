import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, PackageX } from 'lucide-react';
import BaseUrl from '@/consts/baseUrl';

const Shell: React.FC<React.PropsWithChildren<{ testId: string }>> = ({ testId, children }) => (
  <div data-testid={testId} className="flex min-h-[60vh] w-full items-center justify-center px-4 py-16">
    <div className="w-full max-w-md space-y-5 rounded-2xl border border-hairline-light bg-white p-8 text-center shadow-card">
      {children}
    </div>
  </div>
);

export const ProductNotFound: React.FC = () => (
  <Shell testId="product-not-found">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
      <PackageX className="h-7 w-7" />
    </div>
    <div className="space-y-2">
      <h1 className="text-2xl font-light tracking-tight text-black">Không tìm thấy sản phẩm</h1>
      <p className="text-sm leading-relaxed text-zinc-500">
        Sản phẩm này không tồn tại hoặc đã ngừng bán. Hãy quay lại trang chủ để xem các sản phẩm khác.
      </p>
    </div>
    <Link
      to={BaseUrl.Homepage}
      className="inline-flex h-11 items-center gap-2 rounded-full bg-black px-8 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Về trang chủ
    </Link>
  </Shell>
);

export const ProductLoadError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <Shell testId="product-load-error">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
      <AlertCircle className="h-7 w-7" />
    </div>
    <div className="space-y-2">
      <h1 className="text-xl font-semibold text-black">Không thể tải sản phẩm</h1>
      <p className="text-sm text-zinc-500">Đã có lỗi khi kết nối tới máy chủ. Vui lòng thử lại.</p>
    </div>
    <button
      type="button"
      onClick={onRetry}
      className="inline-flex h-11 items-center rounded-full bg-black px-8 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
    >
      Thử lại
    </button>
  </Shell>
);

export const ProductDetailSkeleton: React.FC = () => (
  <div data-testid="product-detail-skeleton" aria-busy="true" className="w-full space-y-8 px-4 py-6 sm:px-6 lg:px-8">
    <div className="h-3 w-56 animate-pulse rounded bg-zinc-200" />
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="aspect-square w-full animate-pulse rounded-2xl bg-zinc-200" />
      <div className="space-y-4">
        <div className="h-5 w-20 animate-pulse rounded-full bg-zinc-200" />
        <div className="h-9 w-3/4 animate-pulse rounded bg-zinc-200" />
        <div className="h-8 w-1/3 animate-pulse rounded bg-zinc-200" />
        <div className="h-16 w-full animate-pulse rounded-2xl bg-zinc-200" />
        <div className="h-32 w-full animate-pulse rounded-2xl bg-zinc-200" />
      </div>
    </div>
  </div>
);
