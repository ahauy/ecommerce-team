import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { MyOrder } from '@/types/order-history.types';

/** Khung đỏ "Trường hợp đơn bị hủy" — chỉ hiện với đơn đã hủy / hoàn tiền. */
const CancelReasonAlert: React.FC<{ order: MyOrder }> = ({ order }) => {
  if (order.status !== 'cancelled' && order.status !== 'refunded') return null;

  const refundNote =
    order.status === 'refunded'
      ? 'Đơn hàng đã được hoàn tiền.'
      : order.paymentStatus === 'paid'
        ? 'Quản trị viên sẽ xử lý hoàn tiền cho bạn.'
        : null;

  return (
    <div
      role="alert"
      data-testid="order-cancel-alert"
      className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="space-y-0.5 text-xs">
        <p className="font-semibold">Trường hợp đơn bị hủy</p>
        <p>
          Lý do hủy: {order.cancelReason ?? 'Không có thông tin.'}
          {refundNote && ` ${refundNote}`}
        </p>
      </div>
    </div>
  );
};

export default CancelReasonAlert;
