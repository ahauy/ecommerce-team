import React from 'react';
import { cn } from '@/lib/utils';
import { formatVnd } from '@/helpers/format';
import { formatOrderDateTime, PAYMENT_STATUS_LABEL } from '@/helpers/orderHistory';
import OrderStatusBadge from '@/pages/orders/components/OrderStatusBadge';
import { OrderItemThumb } from '@/pages/orders/OrderHistoryPage/components/OrderCard';
import { PAYMENT_BADGE_CLASS } from '../helpers';
import type { SellerOrder, SellerOrderAction } from '../types';
import StatusActionButtons from './StatusActionButtons';

interface SellerOrderCardProps {
  order: SellerOrder;
  onView: (order: SellerOrder) => void;
  onAction: (action: SellerOrderAction, order: SellerOrder) => void;
  busy?: boolean;
}

export const PaymentBadge: React.FC<{ status: SellerOrder['paymentStatus']; className?: string }> = ({
  status,
  className,
}) => (
  <span
    data-testid="payment-badge"
    className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none',
      PAYMENT_BADGE_CLASS[status],
      className
    )}
  >
    {PAYMENT_STATUS_LABEL[status]}
  </span>
);

/** 1 đơn bán trong danh sách (Đơn bán #3): mã đơn · người nhận · sản phẩm · tổng tiền · nút xử lý. */
const SellerOrderCard: React.FC<SellerOrderCardProps> = ({ order, onView, onAction, busy }) => {
  const recipient = order.recipient;
  const showCancelReason = (order.status === 'cancelled' || order.status === 'refunded') && order.cancelReason;

  return (
    <article
      data-testid="seller-order-card"
      aria-label={`Đơn ${order.orderCode}`}
      className="rounded-2xl border border-hairline-light bg-white shadow-card"
    >
      <header className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <p className="font-mono text-xs font-semibold text-black">#{order.orderCode}</p>
          {formatOrderDateTime(order.createdAt) && (
            <p className="text-[11px] text-zinc-500">{formatOrderDateTime(order.createdAt)}</p>
          )}
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <div className="grid gap-4 px-5 py-4 sm:px-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-8">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Người nhận</p>
          {recipient ? (
            <>
              <p className="mt-1 text-sm font-semibold text-black">
                {recipient.fullName}
                {recipient.phone && <span className="font-mono text-xs font-medium"> · {recipient.phone}</span>}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{recipient.address}</p>
            </>
          ) : (
            <p className="mt-1 text-xs text-zinc-500">Không có thông tin người nhận.</p>
          )}
        </div>

        <ul className="min-w-0 space-y-3">
          {order.items.map((item, index) => (
            <li key={`${item.productId ?? 'item'}-${index}`} className="flex items-center gap-3">
              <OrderItemThumb src={item.imageUrl} alt={item.name} />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs font-medium text-black">{item.name}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  Số lượng: <span className="tabular-nums">{item.quantity}</span>
                </p>
              </div>
              <p className="shrink-0 text-xs font-medium text-black tabular-nums">{formatVnd(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>
      </div>

      {showCancelReason && (
        <p data-testid="seller-order-cancel-reason" className="mx-5 mb-4 rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-700 sm:mx-6">
          Lý do hủy: {order.cancelReason}
        </p>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline-light px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <p className="text-xs text-zinc-600">
            Tổng tiền{' '}
            <span data-testid="seller-order-total" className="ml-1 text-base font-semibold text-black tabular-nums">
              {formatVnd(order.totalAmount)}
            </span>
          </p>
          <PaymentBadge status={order.paymentStatus} />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="action-view"
            aria-label={`Xem chi tiết ${order.orderCode}`}
            onClick={() => onView(order)}
            className="inline-flex h-9 items-center justify-center rounded-full px-3 text-xs font-medium text-zinc-600 transition-colors duration-150 hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            Xem chi tiết
          </button>
          <StatusActionButtons order={order} onAction={onAction} disabled={busy} />
        </div>
      </footer>
    </article>
  );
};

export default SellerOrderCard;
