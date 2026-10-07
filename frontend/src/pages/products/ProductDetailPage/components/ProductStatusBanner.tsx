import React from 'react';
import { EyeOff, Lock, Store } from 'lucide-react';
import { BLOCK_REASON_SELLER_BANNED } from '@/consts/product';

export type BannerKind = 'owner' | 'hidden' | 'blocked';

interface ProductStatusBannerProps {
  kind: BannerKind;
  /** Chủ shop → lời nhắn hướng dẫn cách xử lý; Admin → chỉ nêu tình trạng. */
  viewerIsOwner: boolean;
  blockReason?: string | null;
}

const blockReasonText = (reason?: string | null): string => {
  if (!reason) return 'Vi phạm quy định của sàn';
  return reason === BLOCK_REASON_SELLER_BANNED ? 'Tài khoản người bán đã bị khóa' : reason;
};

const ProductStatusBanner: React.FC<ProductStatusBannerProps> = ({ kind, viewerIsOwner, blockReason }) => {
  if (kind === 'blocked') {
    return (
      <div
        role="alert"
        data-testid="banner-blocked"
        className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3"
      >
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-red-700">
            Sản phẩm đã bị khóa. Lý do: {blockReasonText(blockReason)}
          </p>
          <p className="mt-0.5 text-xs text-red-600/90">
            {viewerIsOwner
              ? 'Sản phẩm bị tạm ngưng hiển thị công khai do vi phạm tiêu chuẩn cộng đồng. Vui lòng chỉnh sửa và cập nhật lại thông tin để được duyệt lại.'
              : 'Sản phẩm đang bị ẩn khỏi cửa hàng công khai.'}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-red-300 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
          Bị khóa
        </span>
      </div>
    );
  }

  if (kind === 'hidden') {
    return (
      <div
        data-testid="banner-hidden"
        className="flex items-center gap-3 rounded-2xl border border-[#e4e4e7] bg-zinc-100 px-4 py-3"
      >
        <EyeOff className="h-4 w-4 shrink-0 text-zinc-600" aria-hidden="true" />
        <p className="flex-1 text-sm font-medium text-zinc-800">
          {viewerIsOwner
            ? 'Sản phẩm của bạn đang được ẩn — người mua chưa nhìn thấy.'
            : 'Sản phẩm đang bị ẩn khỏi cửa hàng công khai.'}
        </p>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700">
          Đang ẩn
        </span>
      </div>
    );
  }

  return (
    <div
      data-testid="banner-owner"
      className="flex items-center gap-3 rounded-2xl border border-[#bdeccd] bg-[#e9fbef] px-4 py-3"
    >
      <Store className="h-4 w-4 shrink-0 text-zinc-800" aria-hidden="true" />
      <p className="flex-1 text-sm font-medium text-zinc-900">Đây là sản phẩm của bạn</p>
      <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-zinc-800">
        Đang bán
      </span>
    </div>
  );
};

export default ProductStatusBanner;
