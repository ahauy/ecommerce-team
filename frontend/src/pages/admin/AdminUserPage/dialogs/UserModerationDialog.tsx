import React from 'react';
import { Lock, Package, Unlock, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { AdminUser, UserModerationAction } from '../types';

export interface UserModerationDialogProps {
  isOpen: boolean;
  user: AdminUser | null;
  action: UserModerationAction;
  onClose: () => void;
  onConfirm: (user: AdminUser) => Promise<void>;
  isSubmitting?: boolean;
}

export const UserModerationDialog: React.FC<UserModerationDialogProps> = ({
  isOpen,
  user,
  action,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  if (!isOpen || !user) return null;

  const isBan = action === 'ban';
  const displayName = user.fullName || user.email;
  const hasProducts = !!user.shop && user.productCount > 0;

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent
        data-testid="user-moderation-dialog"
        className="max-w-lg w-full bg-white rounded-2xl p-6 flex flex-col border border-hairline-light shadow-card"
        style={{ fontFeatureSettings: '"ss03"' }}
      >
        <AlertDialogHeader className="pb-3 text-left">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isBan ? 'bg-red-50 text-red-600' : 'bg-pistachio text-black'
                }`}
              >
                {isBan ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
              </div>
              <AlertDialogTitle className="text-lg font-medium text-black tracking-tight">
                {isBan ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
              </AlertDialogTitle>
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
          <AlertDialogDescription className="sr-only">
            {isBan ? 'Xác nhận khóa tài khoản người dùng' : 'Xác nhận mở khóa tài khoản người dùng'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="bg-zinc-50 border border-hairline-light rounded-xl p-4 my-2 flex flex-col">
          <span className="font-semibold text-sm text-black truncate">{displayName}</span>
          <span className="text-xs text-zinc-500 truncate">{user.email}</span>
        </div>

        {isBan ? (
          <div
            data-testid="ban-warning"
            className="bg-red-50/50 border border-red-200 rounded-xl p-4 my-2 text-xs text-zinc-700 space-y-1.5 leading-relaxed"
          >
            <p>
              Người dùng sẽ <strong className="text-red-700">không thể đăng nhập</strong> và mọi phiên đang dùng sẽ bị
              từ chối ngay.
            </p>
            {hasProducts ? (
              <p className="inline-flex items-start gap-1.5">
                <Package className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
                <span>
                  Toàn bộ <strong className="text-black">{user.productCount} sản phẩm</strong> của gian hàng{' '}
                  <strong className="text-black">{user.shop?.shopName}</strong> sẽ bị chặn khỏi sàn.
                </span>
              </p>
            ) : (
              <p className="text-zinc-500">Người dùng này chưa có sản phẩm nào đang bán.</p>
            )}
          </div>
        ) : (
          <div
            data-testid="unban-info"
            className="bg-zinc-50 border border-hairline-light rounded-xl p-4 my-2 text-xs text-zinc-700 space-y-1.5 leading-relaxed"
          >
            <p>Người dùng sẽ đăng nhập và mua bán lại bình thường.</p>
            <p className="text-zinc-500">
              Chỉ các sản phẩm bị chặn do khóa tài khoản được mở lại. Sản phẩm bị quản trị viên chặn vì vi phạm vẫn
              giữ nguyên trạng thái.
            </p>
          </div>
        )}

        <div className="flex justify-end items-center gap-3 pt-4 mt-4 border-t border-hairline-light">
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
            onClick={() => void onConfirm(user)}
            disabled={isSubmitting}
            className={`min-h-[44px] rounded-full px-6 py-2.5 text-xs font-medium transition-colors shadow-sm disabled:opacity-50 inline-flex items-center justify-center gap-2 text-white ${
              isBan ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-zinc-800'
            }`}
          >
            {isSubmitting && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>
              {isSubmitting ? 'Đang xử lý...' : isBan ? 'Khóa tài khoản' : 'Mở khóa'}
            </span>
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UserModerationDialog;
