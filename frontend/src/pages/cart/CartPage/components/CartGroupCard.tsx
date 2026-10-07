import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Store } from 'lucide-react';
import { shopPath } from '@/consts/baseUrl';
import { UNKNOWN_SELLER_ID } from '@/helpers/cart';
import { formatVnd } from '@/helpers/format';
import type { CartGroup, CartItem } from '@/types/cart.types';
import CartItemRow from './CartItemRow';

interface CartGroupCardProps {
  group: CartGroup;
  /** `productId` đang được cập nhật / xóa. */
  busyProductId: string | undefined;
  onChangeQuantity: (item: CartItem, quantity: number) => void;
  onRemove: (item: CartItem) => void;
}

/** Thẻ 1 gian hàng: tên shop · danh sách item · tạm tính của shop (BR-CART-005). */
const CartGroupCard: React.FC<CartGroupCardProps> = ({ group, busyProductId, onChangeQuantity, onRemove }) => {
  const { seller, items, subtotal } = group;
  const shopName = seller.shopName ?? 'Gian hàng khác';
  const hasShopPage = !!seller.id && seller.id !== UNKNOWN_SELLER_ID;

  return (
    <section
      data-testid="cart-group"
      aria-label={`Gian hàng ${shopName}`}
      className="overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white shadow-sm"
    >
      <header className="flex items-center justify-between gap-3 border-b border-[#f0f0f2] px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <Store className="h-3.5 w-3.5 shrink-0 text-black" aria-hidden="true" />
          <h2 className="truncate text-xs font-semibold text-black">{shopName}</h2>
        </div>
        {hasShopPage && (
          <Link
            to={shopPath(seller.id)}
            className="inline-flex shrink-0 items-center gap-0.5 text-[10px] text-zinc-500 hover:text-black"
          >
            Xem gian hàng
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        )}
      </header>

      <ul className="divide-y divide-[#f0f0f2]">
        {items.map((item) => (
          <CartItemRow
            key={item.product.id}
            item={item}
            busy={busyProductId === item.product.id}
            onChangeQuantity={onChangeQuantity}
            onRemove={onRemove}
          />
        ))}
      </ul>

      <footer className="flex items-center justify-between gap-3 border-t border-[#f0f0f2] px-5 py-3.5 text-[11px] text-zinc-500">
        <span>{items.length} mặt hàng từ gian này</span>
        <span>
          Tạm tính ({shopName}):{' '}
          <strong data-testid="cart-group-subtotal" className="text-xs font-bold text-black">
            {formatVnd(subtotal)}
          </strong>
        </span>
      </footer>
    </section>
  );
};

export default CartGroupCard;
