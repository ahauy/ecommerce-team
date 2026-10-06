import React, { useEffect } from 'react';
import { AdminCategoryItem } from '@/types/category.types';
import { AlertCircle, AlertTriangle, X, Package, Folder } from 'lucide-react';

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
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isDeleting]);

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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
      data-testid="delete-warning-dialog"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ fontFeatureSettings: '"ss03"' }}
    >
      <div className="max-w-lg w-full bg-white rounded-2xl p-6 flex flex-col relative border border-[#e4e4e7] shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
              {isBlocked ? <AlertTriangle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <h2 id="modal-headline" className="text-lg font-medium text-black tracking-tight">
              {isBlocked ? 'Không thể xóa danh mục' : 'Xác nhận xóa danh mục'}
            </h2>
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
            <div className="bg-zinc-50 border border-[#e4e4e7] rounded-xl p-4 flex items-center justify-between my-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-zinc-200 overflow-hidden flex items-center justify-center text-zinc-600 shrink-0 border border-[#e4e4e7]">
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

              <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#e4e4e7] rounded-full text-zinc-700 text-xs shadow-sm shrink-0">
                <Package className="w-4 h-4 text-zinc-500" />
                <span>{category.productCount} sản phẩm liên kết</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end items-center pt-4 mt-4 border-t border-[#e4e4e7]">
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
              className="bg-zinc-50 border border-[#e4e4e7] rounded-xl p-4 my-3 text-xs text-zinc-700 space-y-1.5 leading-relaxed"
            >
              <p>
                Bạn có chắc chắn muốn xóa vĩnh viễn danh mục <strong className="text-black">{category.name}</strong>?
              </p>
              <p className="text-zinc-500">
                Hành động này không thể hoàn tác. Danh mục sẽ bị gỡ hoàn toàn khỏi thanh điều hướng và hệ thống quản trị.
              </p>
            </div>

            <div className="flex justify-end items-center gap-3 pt-4 mt-4 border-t border-[#e4e4e7]">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="min-h-[44px] rounded-full border border-[#e4e4e7] px-6 py-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors inline-flex items-center justify-center"
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
      </div>
    </div>
  );
};

export default DeleteWarningDialog;
