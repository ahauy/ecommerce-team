import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Store } from 'lucide-react';
import { accountOrderPath, shopPath } from '@/consts/baseUrl';
import { formatVnd } from '@/helpers/format';
import type { MyOrder } from '@/types/order-history.types';
import OrderStatusBadge from '../../components/OrderStatusBadge';

export const OrderItemThumb: React.FC<{ src: string | null; alt: string; className?: string }> = ({
  src,
  alt,
  className = 'h-12 w-12',
}) =>
  src ? (
    <img src={src} alt={alt} loading="lazy" className={`${className} shrink-0 rounded-lg border border-hairline-light bg-zinc-100 object-cover`} />
  ) : (
    <div
      aria-hidden="true"
      className={`${className} flex shrink-0 items-center justify-center rounded-lg border border-hairline-light bg-zinc-100 text-zinc-400`}
    >
      <Package className="h-5 w-5" />
    </div>
  );

/** "Số lượng: 2 (2 × 1.850.000 ₫)" — chỉ hiện phần trong ngoặc khi mua từ 2 trở lên. */
export const quantityLabel = (quantity: number, price: number): string =>
  quantity > 1 ? `Số lượng: ${quantity} (${quantity} × ${formatVnd(price)})` : `Số lượng: ${quantity}`;

/** 1 đơn của 1 shop trong danh sách "Đơn mua". */
const OrderCard: React.FC<{ order: MyOrder }> = ({ order }) => {
  const shopName = order.seller.shopName ?? 'Gian hàng';
  const showRefundNote = order.status === 'cancelled' && order.paymentStatus === 'paid';

  return (
    <article
      data-testid="order-card"
      aria-label={`Đơn ${order.orderCode}`}
      className="space-y-4 rounded-2xl border border-hairline-light bg-white p-6 shadow-card"
    >
      <header className="flex items-start justify-between gap-3 border-b border-hairline-light pb-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <Store className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
          <div className="min-w-0">
            {order.seller.id ? (
              <Link to={shopPath(order.seller.id)} className="block truncate text-sm font-semibold text-black hover:underline">
                {shopName}
              </Link>
            ) : (
              <p className="truncate text-sm font-semibold text-black">{shopName}</p>
            )}
            <p className="text-[11px] text-zinc-500">
              <span className="tabular-nums">{order.items.length}</span> sản phẩm · Mã đơn <span className="font-mono tabular-nums">#{order.orderCode}</span>
            </p>
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <ul className="space-y-3">
        {order.items.map((item, index) => (
          <li key={`${item.productId ?? 'item'}-${index}`} className="flex items-center gap-3">
            <OrderItemThumb src={item.imageUrl} alt={item.name} />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-xs font-medium text-black">{item.name}</p>
              <p className="mt-0.5 text-[11px] text-zinc-500 tabular-nums">{quantityLabel(item.quantity, item.price)}</p>
            </div>
            <p className="shrink-0 text-xs font-medium text-black tabular-nums">{formatVnd(item.price * item.quantity)}</p>
          </li>
        ))}
      </ul>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline-light pt-3">
        <div>
          <p className="text-xs text-zinc-600">
            Tổng thanh toán:{' '}
            <span data-testid="order-total" className="text-base font-semibold text-black tabular-nums">
              {formatVnd(order.totalAmount)}
            </span>
          </p>
          {showRefundNote && (
            <p className="mt-0.5 text-[11px] text-zinc-500">Quản trị viên sẽ hoàn tiền cho bạn</p>
          )}
        </div>
        <Link
          to={accountOrderPath(order.id)}
          className="inline-flex h-9 items-center justify-center rounded-full border border-hairline-light bg-white px-5 text-xs font-semibold text-black transition-colors duration-150 hover:border-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          Xem chi tiết
        </Link>
      </footer>
    </article>
  );
};

export default OrderCard;
