import React from 'react';
import { formatOrderDateTime, type CheckoutGroup } from '@/helpers/orderHistory';
import OrderCard from './OrderCard';

/** Các đơn cùng 1 lần thanh toán (`checkoutCode`) — tiêu đề "Thanh toán CHK-... • 15/09/2026 14:32". */
const OrderGroup: React.FC<{ group: CheckoutGroup }> = ({ group }) => (
  <section data-testid="order-group" className="space-y-3">
    <div className="flex items-center justify-between gap-3 px-1 text-[11px] text-zinc-500">
      <p className="min-w-0 truncate">
        {group.checkoutCode ? (
          <>
            Thanh toán <span className="font-mono tabular-nums">{group.checkoutCode}</span>
          </>
        ) : (
          'Thanh toán'
        )}
        {formatOrderDateTime(group.createdAt) && ` • ${formatOrderDateTime(group.createdAt)}`}
      </p>
      <p className="shrink-0 tabular-nums">{group.orders.length} đơn hàng</p>
    </div>
    {group.orders.map((order) => (
      <OrderCard key={order.id} order={order} />
    ))}
  </section>
);

export default OrderGroup;
