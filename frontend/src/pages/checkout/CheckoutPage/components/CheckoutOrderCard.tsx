import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, ImageIcon, Package, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import BaseUrl, { productPath } from '@/consts/baseUrl';
import { formatVnd } from '@/helpers/format';
import type { CheckoutIssue } from '@/helpers/checkout';
import type { Cart } from '@/types/cart.types';

interface CheckoutOrderCardProps {
  cart: Cart;
  productCount: number;
  issues: CheckoutIssue[];
}

/** Thẻ ② "Đơn hàng của bạn": SP nhóm theo gian hàng (mỗi gian = 1 Order), SP thiếu hàng được tô đỏ. */
const CheckoutOrderCard: React.FC<CheckoutOrderCardProps> = ({ cart, productCount, issues }) => {
  const issueById = new Map(issues.map((i) => [i.productId, i]));

  return (
    <section
      data-testid="checkout-items"
      aria-label="Đơn hàng của bạn"
      className="rounded-2xl border border-[#e4e4e7] bg-white p-5 shadow-sm sm:p-6"
    >
      <header className="mb-5 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-sm font-semibold text-black">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
            2
          </span>
          Đơn hàng của bạn
        </h2>
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{productCount} sản phẩm</span>
      </header>

      <div className="space-y-6">
        {cart.groups.map((group) => {
          const shopName = group.seller.shopName ?? 'Gian hàng khác';

          return (
            <div key={group.seller.id} data-testid="checkout-group">
              <div className="flex items-center gap-2 border-b border-[#f0f0f2] pb-3">
                <Store className="h-3.5 w-3.5 shrink-0 text-black" aria-hidden="true" />
                <h3 className="truncate text-xs font-semibold text-black">{shopName}</h3>
              </div>

              <ul className="divide-y divide-[#f0f0f2]">
                {group.items.map((item) => {
                  const issue = issueById.get(item.product.id);
                  const hasIssue = !!issue || item.status !== 'available';
                  const { product, quantity } = item;

                  return (
                    <li key={product.id} data-testid="checkout-item" data-issue={hasIssue || undefined} className="py-4">
                      <div
                        className={cn(
                          'flex items-start gap-3',
                          hasIssue && 'rounded-xl border border-red-200 bg-red-50/40 p-3'
                        )}
                      >
                        <Link
                          to={productPath(product.id)}
                          tabIndex={-1}
                          aria-hidden="true"
                          className={cn(
                            'flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f4f4f5]',
                            hasIssue && 'opacity-70'
                          )}
                        >
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-zinc-400" />
                          )}
                        </Link>

                        <div className="min-w-0 flex-1 space-y-1">
                          <Link
                            to={productPath(product.id)}
                            className="block truncate text-xs font-semibold text-black hover:underline"
                          >
                            {product.name}
                          </Link>
                          <p className="text-[11px] text-zinc-500">
                            Số lượng: <span className={cn(hasIssue && 'font-semibold text-red-600')}>{quantity}</span>
                            {quantity > 1 && <span className="text-zinc-400"> · Đơn giá: {formatVnd(product.price)}</span>}
                          </p>
                        </div>

                        <p
                          data-testid="checkout-item-total"
                          className={cn(
                            'shrink-0 text-xs font-bold',
                            item.status === 'available' ? 'text-black' : 'text-zinc-400 line-through'
                          )}
                        >
                          {formatVnd(item.lineTotal)}
                        </p>
                      </div>

                      {hasIssue && issue && (
                        <div
                          role="alert"
                          data-testid="checkout-item-issue"
                          className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-[11px] text-red-600"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            {issue.available === null
                              ? 'Sản phẩm đã ngừng bán'
                              : issue.available <= 0
                                ? 'Sản phẩm đã hết hàng'
                                : `Chỉ còn ${issue.available} sản phẩm trong kho (Bạn chọn ${issue.requested})`}
                          </span>
                          <Link
                            to={BaseUrl.Cart}
                            className="inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
                          >
                            {issue.available === null || issue.available <= 0 ? 'Xóa khỏi giỏ' : 'Chỉnh số lượng'}
                            <ArrowRight className="h-3 w-3" aria-hidden="true" />
                          </Link>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="flex items-center justify-end gap-2 border-t border-[#f0f0f2] pt-3 text-[11px] text-zinc-500">
                <Package className="h-3 w-3" aria-hidden="true" />
                <span>
                  Tạm tính ({shopName}):{' '}
                  <strong data-testid="checkout-group-subtotal" className="text-xs font-bold text-black">
                    {formatVnd(group.subtotal)}
                  </strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CheckoutOrderCard;
