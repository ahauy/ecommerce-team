import React from 'react';
import { Info, MapPin, User } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { SellerOrder } from '../types';

type ConfirmAction = 'ship' | 'deliver';

interface ConfirmStatusDialogProps {
  action: ConfirmAction | null;
  order: SellerOrder | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const COPY: Record<ConfirmAction, { title: string; question: (code: string) => React.ReactNode; note: string }> = {
  ship: {
    title: 'Xác nhận giao hàng',
    question: (code) => (
      <>
        Xác nhận chuyển đơn <strong className="font-semibold text-black">#{code}</strong> sang trạng thái Đang giao?
      </>
    ),
    note: 'Đơn hàng sẽ được chuyển sang danh sách Đang giao để bạn theo dõi.',
  },
  deliver: {
    title: 'Xác nhận đã giao hàng',
    question: (code) => (
      <>
        Xác nhận đơn <strong className="font-semibold text-black">#{code}</strong> đã được giao tới người nhận?
      </>
    ),
    note: 'Đơn hàng sẽ chuyển sang trạng thái Đã giao. Thao tác này không thể hoàn tác.',
  },
};

/** Dialog xác nhận Giao hàng / Đã giao (Đơn bán #2). */
export const ConfirmStatusDialog: React.FC<ConfirmStatusDialogProps> = ({
  action,
  order,
  isSubmitting = false,
  onClose,
  onConfirm,
}) => {
  const open = Boolean(action && order);
  const copy = action ? COPY[action] : null;
  const recipient = order?.recipient;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !isSubmitting && onClose()}>
      {open && copy && order && (
        <DialogContent
          data-testid="confirm-status-dialog"
          className="max-w-[440px] gap-0 rounded-2xl border-[#e4e4e7] bg-white p-6 sm:rounded-2xl"
          style={{ fontFeatureSettings: '"ss03"' }}
        >
          <DialogTitle className="text-lg font-medium tracking-tight text-black">{copy.title}</DialogTitle>
          <DialogDescription className="mt-3 text-sm leading-relaxed text-zinc-700">
            {copy.question(order.orderCode)}
          </DialogDescription>

          <div className="mt-4 space-y-2.5 rounded-xl border border-[#e4e4e7] bg-[#fbfbf5] px-4 py-3 text-xs">
            <p className="flex items-start gap-2 text-zinc-700">
              <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
              <span>
                <span className="font-semibold text-black">Người nhận:</span> {recipient?.fullName || '—'}
                {recipient?.phone && ` (${recipient.phone})`}
              </span>
            </p>
            <p className="flex items-start gap-2 text-zinc-700">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
              <span>
                <span className="font-semibold text-black">Địa chỉ:</span> {recipient?.address || '—'}
              </span>
            </p>
          </div>

          <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-zinc-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
            {copy.note}
          </p>

          <div className="mt-5 flex items-center justify-end gap-3 border-t border-[#e4e4e7] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center justify-center rounded-full border border-black bg-white px-6 text-xs font-semibold text-black transition-colors hover:bg-zinc-100 disabled:opacity-50"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-black px-6 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default ConfirmStatusDialog;
