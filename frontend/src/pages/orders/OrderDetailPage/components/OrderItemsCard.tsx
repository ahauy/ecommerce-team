import React from 'react';
import { formatVnd } from '@/helpers/format';
import type { MyOrder } from '@/types/order-history.types';
import { OrderItemThumb } from '../../OrderHistoryPage/components/OrderCard';

/** "Sản phẩm trong đơn (n)" + tạm tính + tổng thanh toán. */
const OrderItemsCard: React.FC<{ order: MyOrder }> = ({ order }) => {
  const subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return (
    <section data-testid="order-items" className="rounded-2xl border border-[#e4e4e7] bg-white p-6 shadow-card">
      <h2 className="mb-4 text-sm font-semibold text-black">Sản phẩm trong đơn ({order.items.length})</h2>

      <ul className="divide-y divide-[#e4e4e7]">
        {order.items.map((item, index) => (
          <li key={`${item.productId ?? 'item'}-${index}`} className="flex items-center gap-4 py-3 first:pt-0">
            <OrderItemThumb src={item.imageUrl} alt={item.name} className="h-16 w-16" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-xs font-medium text-black">{item.name}</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">Số lượng: {item.quantity}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-medium text-black">{formatVnd(item.price * item.quantity)}</p>
              {item.quantity > 1 && (
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {item.quantity} × {formatVnd(item.price)}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <dl className="mt-2 space-y-2 border-t border-[#e4e4e7] pt-4 text-right">
        <div className="flex items-center justify-end gap-8 text-xs text-zinc-600">
          <dt>Tạm tính</dt>
          <dd data-testid="order-subtotal" className="min-w-[110px] font-medium text-black">
            {formatVnd(subtotal)}
          </dd>
        </div>
        <div className="flex items-center justify-end gap-8">
          <dt className="text-xs text-zinc-600">Tổng thanh toán</dt>
          <dd data-testid="order-detail-total" className="min-w-[110px] text-xl font-semibold text-black">
            {formatVnd(order.totalAmount)}
          </dd>
        </div>
      </dl>
    </section>
  );
};

export default OrderItemsCard;
