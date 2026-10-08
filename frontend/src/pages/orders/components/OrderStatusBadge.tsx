import React from 'react';
import { cn } from '@/lib/utils';
import { ORDER_STATUS_META } from '@/helpers/orderHistory';
import type { OrderStatus } from '@/types/order-history.types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

/** Badge trạng thái đơn — dùng chung cho danh sách và chi tiết. */
const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, className }) => {
  const meta = ORDER_STATUS_META[status];
  return (
    <span
      data-testid="order-status-badge"
      data-status={status}
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none',
        meta.badgeClass,
        className
      )}
    >
      {meta.label}
    </span>
  );
};

export default OrderStatusBadge;
