import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { OwnerProduct } from '../types';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface DeleteProductDialogProps {
  isOpen: boolean;
  product: OwnerProduct | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  isDeleting?: boolean;
}

export const DeleteProductDialog: React.FC<DeleteProductDialogProps> = ({
  isOpen,
  product,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isDeleting]);

  if (!isOpen || !product) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <AlertDialogContent
        data-testid="delete-product-dialog"
        className="max-w-md w-full bg-white rounded-2xl p-6 flex flex-col border border-hairline-light shadow-card"
        style={{ fontFeatureSettings: '"ss03"' }}
      >
        <AlertDialogHeader className="pb-3 text-left">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <AlertDialogTitle className="text-base font-semibold text-black tracking-tight">
                Xác nhận ẩn sản phẩm
              </AlertDialogTitle>
            </div>
            <button
              type="button"
              aria-label="Đóng hộp thoại"
              onClick={onClose}
              disabled={isDeleting}
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </AlertDialogHeader>

        <div className="bg-zinc-50 border border-hairline-light rounded-xl p-4 my-2 text-xs text-zinc-700 space-y-1.5 leading-relaxed">
          <p>
            Bạn có chắc chắn muốn ẩn sản phẩm{' '}
            <strong className="text-black font-semibold">{product.name}</strong>?
          </p>
          <p className="text-zinc-500">
            Sản phẩm sẽ bị ẩn khỏi gian hàng công khai. Bạn có thể bật lại hiển thị bất cứ lúc nào trong mục Sản phẩm của tôi.
          </p>
        </div>

        <div className="flex justify-end items-center gap-3 pt-4 mt-2 border-t border-hairline-light">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="min-h-[40px] rounded-full border border-hairline-light px-5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => onConfirm(product.id)}
            disabled={isDeleting}
            className="min-h-[40px] rounded-full bg-red-600 text-white px-5 py-2 text-xs font-semibold hover:bg-red-700 transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
          >
            {isDeleting && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{isDeleting ? 'Đang xử lý...' : 'Ẩn sản phẩm'}</span>
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
