import React from 'react';
import { AdminCategoryItem } from '@/types/category.types';
import { AlertCircle, AlertTriangle, X, Package, Folder } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface DeleteWarningDialogProps {
  isOpen: boolean;
  category: AdminCategoryItem | null;
  onClose: () => void;
  onConfirmDelete: (id: string) => Promise<void>;
  isDeleting?: boolean;
}

export const DeleteWarningDialog: React.FC<DeleteWarningDialogProps> = ({
  isOpen,
  category,
  onClose,
  onConfirmDelete,
  isDeleting = false,
}) => {
  if (!isOpen || !category) {
    return null;
  }

  const isBlocked = (category.productCount ?? 0) > 0;

  const handleConfirm = async () => {
    await onConfirmDelete(category._id);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <AlertDialogContent
        data-testid="delete-warning-dialog"
        onClick={handleBackdropClick}
        className="max-w-lg w-full bg-white rounded-2xl p-6 flex flex-col relative border border-hairline-light shadow-card"
        style={{ fontFeatureSettings: '"ss03"' }}
      >
        {/* Top Header */}
        <AlertDialogHeader className="pb-3 text-left">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                {isBlocked ? <AlertTriangle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <AlertDialogTitle id="modal-headline" className="text-lg font-medium text-black tracking-tight">
                {isBlocked ? 'Không thể xóa danh mục' : 'Xác nhận xóa danh mục'}
              </AlertDialogTitle>
            </div>
            <button
              type="button"
              aria-label="Đóng hộp thoại"
              onClick={onClose}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors -mr-2 -mt-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <AlertDialogDescription className="sr-only">
            Xác nhận hoặc cảnh báo khi thực hiện xóa danh mục
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Content Body */}
        {isBlocked ? (
          <>
            {/* Red Alert Container */}
            <div
              data-testid="blocked-delete-alert"
              className="bg-red-50/50 border border-red-200 rounded-xl p-4 flex items-start gap-3 my-3"
            >
              <AlertCircle className="shrink-0 w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-xs text-red-700">
                  Không thể xóa danh mục này vì hiện có {category.productCount} sản phẩm đang sử dụng danh mục.
                </span>
                <p className="text-xs text-zinc-700 leading-relaxed">
                  Vui lòng chuyển hoặc gán lại toàn bộ {category.productCount} sản phẩm sang danh mục khác trước khi thực hiện xóa.
                </p>
              </div>
            </div>

            {/* Category Context Row */}
            <div className="bg-zinc-50 border border-hairline-light rounded-xl p-4 flex items-center justify-between my-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-zinc-200 overflow-hidden flex items-center justify-center text-zinc-600 shrink-0 border border-hairline-light">
                  {category.imageUrl ? (
                    <img src={category.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Folder className="w-5 h-5" />
                  )}
                </div>
                <div className="flex flex-col truncate">
                  <span className="font-semibold text-sm text-black truncate">{category.name}</span>
                  <span className="text-xs text-zinc-500 font-mono">/category/{category.slug}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-hairline-light rounded-full text-zinc-700 text-xs shadow-sm shrink-0">
                <Package className="w-4 h-4 text-zinc-500" />
                <span>{category.productCount} sản phẩm liên kết</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end items-center pt-4 mt-4 border-t border-hairline-light">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] rounded-full bg-black text-white px-8 py-2.5 font-medium text-xs hover:bg-zinc-800 transition-colors shadow-sm inline-flex items-center justify-center"
              >
                Đóng
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Permitted Confirm Mode */}
            <div
              data-testid="permitted-delete-alert"
              className="bg-zinc-50 border border-hairline-light rounded-xl p-4 my-3 text-xs text-zinc-700 space-y-1.5 leading-relaxed"
            >
              <p>
                Bạn có chắc chắn muốn xóa vĩnh viễn danh mục <strong className="text-black">{category.name}</strong>?
              </p>
              <p className="text-zinc-500">
                Hành động này không thể hoàn tác. Danh mục sẽ bị gỡ hoàn toàn khỏi thanh điều hướng và hệ thống quản trị.
              </p>
            </div>

            <div className="flex justify-end items-center gap-3 pt-4 mt-4 border-t border-hairline-light">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="min-h-[44px] rounded-full border border-hairline-light px-6 py-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors inline-flex items-center justify-center"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isDeleting}
                className="min-h-[44px] rounded-full bg-red-600 text-white px-6 py-2.5 text-xs font-medium hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {isDeleting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>{isDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}</span>
              </button>
            </div>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteWarningDialog;
