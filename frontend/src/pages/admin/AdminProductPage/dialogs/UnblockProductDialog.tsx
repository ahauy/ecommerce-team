import React from 'react';
import { ShieldCheck, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SELLER_BANNED_REASON, type AdminProduct } from '../types';

export interface UnblockProductDialogProps {
  isOpen: boolean;
  product: AdminProduct | null;
  onClose: () => void;
  onConfirm: (product: AdminProduct) => Promise<void>;
  isSubmitting?: boolean;
}

export const UnblockProductDialog: React.FC<UnblockProductDialogProps> = ({
  isOpen,
  product,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  if (!isOpen || !product) return null;

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };
  const reasonText =
    product.blockReason === SELLER_BANNED_REASON ? 'Người bán từng bị khóa tài khoản' : product.blockReason;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent
        data-testid="unblock-product-dialog"
        className="max-w-lg w-full bg-white rounded-2xl p-6 flex flex-col border border-hairline-light shadow-card"
        style={{ fontFeatureSettings: '"ss03"' }}
      >
        <AlertDialogHeader className="pb-3 text-left">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pistachio text-black flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <AlertDialogTitle className="text-lg font-medium text-black tracking-tight">Mở chặn sản phẩm</AlertDialogTitle>
            </div>
            <button
              type="button"
              aria-label="Đóng hộp thoại"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors -mr-2 -mt-2 disabled:opacity-40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <AlertDialogDescription className="sr-only">Xác nhận mở chặn sản phẩm</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="bg-zinc-50 border border-hairline-light rounded-xl p-4 flex flex-col gap-1">
          <span className="font-semibold text-sm text-black truncate">{product.name}</span>
          {reasonText && (
            <span className="text-xs text-zinc-500">
              Lý do đã chặn: <span className="text-zinc-700">{reasonText}</span>
            </span>
          )}
        </div>

        <div
          data-testid="unblock-info"
          className="bg-zinc-50 border border-hairline-light rounded-xl p-4 text-xs text-zinc-700 space-y-1.5 leading-relaxed"
        >
          {product.isActive ? (
            <p>Sản phẩm sẽ hiển thị lại trên sàn và người mua có thể đặt hàng.</p>
          ) : (
            <p>
              Người bán đang tự ẩn sản phẩm này, nên sau khi mở chặn sản phẩm <strong>vẫn chưa hiển thị</strong> cho tới
              khi người bán bật lại.
            </p>
          )}
        </div>

        <div className="flex justify-end items-center gap-3 pt-4 mt-2 border-t border-hairline-light">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="min-h-[44px] rounded-full border border-hairline-light px-6 py-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors inline-flex items-center justify-center disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => void onConfirm(product)}
            disabled={isSubmitting}
            className="min-h-[44px] rounded-full bg-black text-white px-6 py-2.5 text-xs font-medium hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{isSubmitting ? 'Đang xử lý...' : 'Mở chặn'}</span>
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UnblockProductDialog;
