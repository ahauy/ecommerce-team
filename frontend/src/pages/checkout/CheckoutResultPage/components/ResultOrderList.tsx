import React from 'react';
import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import BaseUrl, { accountOrderPath } from '@/consts/baseUrl';
import { formatVnd } from '@/helpers/format';
import type { CheckoutResultOrder } from '@/types/checkout-result.types';
import OrderStatusBadge from '@/pages/orders/components/OrderStatusBadge';

const cardClass = 'rounded-2xl border border-hairline-light bg-white p-5 shadow-card';

/** "2 sản phẩm (Tên A, Tên B)" — chỉ có khi BE trả `items`; thiếu thì trả null. */
export const summarizeItems = (order: CheckoutResultOrder): string | null => {
  if (order.items.length === 0) return null;
  const units = order.items.reduce((sum, i) => sum + i.quantity, 0);
  return `${units} sản phẩm (${order.items.map((i) => i.name).join(', ')})`;
};

const orderLink = (order: CheckoutResultOrder): string =>
  order.id ? accountOrderPath(order.id) : BaseUrl.AccountOrders;

/** Danh sách đơn khi thanh toán thành công — mỗi gian hàng 1 thẻ (Đặt hàng thành công #1). */
export const SuccessOrderList: React.FC<{ orders: CheckoutResultOrder[] }> = ({ orders }) => (
  <section data-testid="result-orders" aria-label="Danh sách đơn hàng đã tạo" className="space-y-3">
    <div className="flex items-center justify-between px-1">
      <h2 className="text-xs font-semibold text-black">Danh sách đơn hàng đã tạo</h2>
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{orders.length} gian hàng</p>
    </div>

    {orders.map((order) => {
      const summary = summarizeItems(order);
      return (
        <article key={order.orderCode} data-testid="result-order" className={cardClass}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <Store className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-black">{order.shopName ?? 'Gian hàng'}</p>
                <p className="text-[11px] text-zinc-500 font-mono tabular-nums">Đơn hàng: #{order.orderCode}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Link to={orderLink(order)} className="text-[11px] font-medium text-zinc-600 hover:text-black hover:underline">
                Xem chi tiết
              </Link>
              <OrderStatusBadge status={order.status} />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-zinc-50 px-4 py-3 text-xs">
            <p className="min-w-0 truncate text-zinc-600">{summary ?? 'Tổng tiền đơn hàng'}</p>
            <p data-testid="result-order-total" className="shrink-0 font-semibold text-black tabular-nums">
              {formatVnd(order.totalAmount)}
            </p>
          </div>
        </article>
      );
    })}
  </section>
);

/** Danh sách đơn gọn khi thất bại / hết hạn (đơn đã bị hủy). */
export const FailedOrderList: React.FC<{ orders: CheckoutResultOrder[] }> = ({ orders }) => {
  if (orders.length === 0) return null;
  return (
    <section data-testid="result-orders" aria-label="Đơn hàng liên quan" className="space-y-3">
      <h2 className="px-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">Đơn hàng liên quan</h2>
      {orders.map((order) => (
        <article
          key={order.orderCode}
          data-testid="result-order"
          className="flex items-center justify-between gap-3 rounded-2xl border border-hairline-light bg-white px-5 py-4 shadow-card"
        >
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-black">{order.shopName ?? 'Gian hàng'}</p>
            <p className="text-[11px] text-zinc-500 font-mono tabular-nums">Mã đơn: #{order.orderCode}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </article>
      ))}
    </section>
  );
};
