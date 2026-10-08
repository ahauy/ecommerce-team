import React from 'react';
import { Link } from 'react-router-dom';
import { ImageIcon, Info, Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { productPath } from '@/consts/baseUrl';
import { formatVnd } from '@/helpers/format';
import { getStatusLabel } from '@/helpers/cart';
import type { CartItem } from '@/types/cart.types';

interface CartItemRowProps {
  item: CartItem;
  /** Đang gọi API cho item này → khoá thao tác để tránh bấm chồng. */
  busy: boolean;
  onChangeQuantity: (item: CartItem, quantity: number) => void;
  onRemove: (item: CartItem) => void;
}

const stepBtn =
  'flex h-7 w-7 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40';

/** 1 dòng sản phẩm trong giỏ: ảnh · tên/giá/badge · số lượng · thành tiền · xóa. */
const CartItemRow: React.FC<CartItemRowProps> = ({ item, busy, onChangeQuantity, onRemove }) => {
  const { product, quantity, status, lineTotal } = item;
  const label = getStatusLabel(status, product.stock);
  const purchasable = status === 'available';
  // Hết hàng / ngừng bán: không đổi được số lượng, chỉ xóa.
  const canEdit = status === 'available' || status === 'exceeds_stock';

  // exceeds_stock: quantity > stock → PATCH phải ≤ stock, nên bấm "−" đưa thẳng về mức tồn kho.
  const decreaseTo = Math.max(1, Math.min(quantity - 1, product.stock));
  const canDecrease = canEdit && !busy && quantity > 1;
  const canIncrease = canEdit && !busy && quantity < product.stock;

  return (
    <li data-testid="cart-item" data-status={status} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
      <Link
        to={productPath(product.id)}
        tabIndex={-1}
        aria-hidden="true"
        className={cn(
          'relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f4f4f5] sm:h-[54px] sm:w-[54px]',
          !purchasable && 'opacity-60 grayscale'
        )}
      >
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-5 w-5 text-zinc-400" />
        )}
      </Link>

      <div className="min-w-0 flex-1 basis-40 space-y-1">
        <Link
          to={productPath(product.id)}
          className={cn(
            'block truncate text-xs font-semibold hover:underline',
            purchasable ? 'text-black' : 'text-zinc-500'
          )}
        >
          {product.name}
        </Link>
        <p className="text-[11px] text-zinc-500">{formatVnd(product.price)}</p>
        {label && (
          <span
            data-testid="cart-item-status"
            className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600"
          >
            <Info className="h-3 w-3" aria-hidden="true" />
            {label}
          </span>
        )}
      </div>

      <div className="ml-auto flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end sm:gap-5">
        <div
          role="group"
          aria-label={`Số lượng ${product.name}`}
          className={cn('inline-flex items-center rounded-full bg-zinc-100 p-0.5', !canEdit && 'opacity-50')}
        >
          <button
            type="button"
            aria-label="Giảm số lượng"
            disabled={!canDecrease}
            onClick={() => onChangeQuantity(item, decreaseTo)}
            className={stepBtn}
          >
            <Minus className="h-3 w-3" />
          </button>
          <output aria-live="polite" data-testid="cart-item-qty" className="w-8 text-center text-xs font-semibold text-black">
            {quantity}
          </output>
          <button
            type="button"
            aria-label="Tăng số lượng"
            disabled={!canIncrease}
            onClick={() => onChangeQuantity(item, quantity + 1)}
            className={stepBtn}
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        <p
          data-testid="cart-item-total"
          className={cn(
            'w-28 text-right text-xs font-bold',
            purchasable ? 'text-black' : 'text-zinc-400 line-through'
          )}
        >
          {formatVnd(lineTotal)}
        </p>

        <button
          type="button"
          aria-label={`Xóa ${product.name} khỏi giỏ hàng`}
          disabled={busy}
          onClick={() => onRemove(item)}
          className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
};

export default CartItemRow;
