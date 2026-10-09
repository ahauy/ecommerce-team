import React, { useState } from 'react';
import { AlertCircle, Info, User } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatVnd } from '@/helpers/format';
import type { SellerOrder } from '../types';

interface CancelReasonDialogProps {
  order: SellerOrder | null;
  isSubmitting?: boolean;
  onClose: () => void;
  /** Nhận lý do đã trim (luôn khác rỗng). */
  onConfirm: (reason: string) => void;
}

/** Form nằm trong `DialogContent` nên state (lý do, trạng thái "đã chạm") tự reset mỗi lần mở lại. */
const CancelForm: React.FC<Required<Pick<CancelReasonDialogProps, 'isSubmitting'>> & Omit<CancelReasonDialogProps, 'isSubmitting' | 'order'> & { order: SellerOrder }> = ({
  order,
  isSubmitting,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  const trimmed = reason.trim();
  const showError = touched && trimmed === '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (trimmed === '' || isSubmitting) return;
    onConfirm(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-red-700">Hủy đơn bán</p>
        <DialogTitle className="text-lg font-medium tracking-tight text-black">
          Hủy đơn hàng #{order.orderCode}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Nhập lý do hủy đơn. Sản phẩm sẽ được hoàn lại kho.
        </DialogDescription>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-xl border border-hairline-light bg-canvas-cream px-4 py-3 text-xs">
        <p className="flex items-center gap-1.5 text-zinc-600">
          <User className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
          Người mua: <span className="font-semibold text-black">{order.recipient?.fullName || '—'}</span>
        </p>
        <p className="text-zinc-600">
          Tổng tiền: <span className="font-semibold text-black">{formatVnd(order.totalAmount)}</span>
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="cancel-reason" className="text-xs font-semibold text-black">
            Lý do hủy <span className="text-red-600">*</span>
          </label>
          <span className="text-[11px] text-zinc-400">Bắt buộc</span>
        </div>
        <Textarea
          id="cancel-reason"
          value={reason}
          disabled={isSubmitting}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="Nhập lý do người bán hủy đơn hàng..."
          aria-invalid={showError}
          aria-describedby={showError ? 'cancel-reason-error' : undefined}
          className={cn(
            'min-h-[96px] resize-none rounded-lg bg-white px-3 py-2.5 text-xs placeholder:text-zinc-400',
            showError ? 'border-red-600 focus-visible:ring-red-200' : 'border-hairline-light focus-visible:ring-zinc-200'
          )}
        />
        {showError && (
          <p id="cancel-reason-error" role="alert" className="flex items-center gap-1.5 text-[11px] text-red-700">
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Vui lòng nhập lý do hủy đơn hàng
          </p>
        )}
      </div>

      <div className="flex items-start gap-2.5 rounded-xl bg-canvas-cream px-4 py-3 text-[11px] leading-relaxed text-zinc-600">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
        <p>Sản phẩm sẽ được hoàn lại kho. Quản trị viên sẽ xử lý hoàn tiền cho người mua.</p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="inline-flex h-10 items-center justify-center rounded-full border border-black bg-white px-6 text-xs font-semibold text-black transition-colors hover:bg-zinc-100 disabled:opacity-50"
        >
          Đóng
        </button>
        <button
          type="submit"
          disabled={trimmed === '' || isSubmitting}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-black px-6 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isSubmitting && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          {isSubmitting ? 'Đang xử lý...' : 'Xác nhận hủy'}
        </button>
      </div>
    </form>
  );
};

/** Dialog hủy đơn bán (Đơn bán #1): bắt buộc nhập lý do (BR-ORD-011). */
export const CancelReasonDialog: React.FC<CancelReasonDialogProps> = ({
  order,
  isSubmitting = false,
  onClose,
  onConfirm,
}) => (
  <Dialog open={Boolean(order)} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
    {order && (
      <DialogContent
        data-testid="cancel-reason-dialog"
        className="max-w-[480px] rounded-2xl border-hairline-light bg-white p-6 sm:rounded-2xl"
        style={{ fontFeatureSettings: '"ss03"' }}
      >
        <CancelForm order={order} isSubmitting={isSubmitting} onClose={onClose} onConfirm={onConfirm} />
      </DialogContent>
    )}
  </Dialog>
);

export default CancelReasonDialog;
