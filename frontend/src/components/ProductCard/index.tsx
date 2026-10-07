import React from 'react';
import { Link } from 'react-router-dom';
import { ImageIcon, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { productPath } from '@/consts/baseUrl';
import { formatVnd } from '@/helpers/format';
import type { ProductSummary } from '@/types/product.types';

interface ProductCardProps {
  product: ProductSummary;
  className?: string;
}

/**
 * Thẻ sản phẩm dùng cho lưới danh sách và mục "Sản phẩm khác của gian hàng".
 * stock = 0 → phủ nhãn "Hết hàng", làm mờ giá (BR-PRD-003): vẫn bấm xem được.
 */
const ProductCard: React.FC<ProductCardProps> = ({ product, className }) => {
  const soldOut = product.stock <= 0;

  return (
    <Link
      to={productPath(product.id)}
      data-testid="product-card"
      className={cn(
        'group flex h-full flex-col rounded-2xl border border-[#e4e4e7] bg-white p-2.5 shadow-sm transition-colors hover:border-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black',
        className
      )}
    >
      <div
        className={cn(
          'relative aspect-square w-full overflow-hidden rounded-xl',
          soldOut ? 'bg-zinc-200' : 'bg-[#f4f4f5]'
        )}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className={cn('h-full w-full object-cover', soldOut && 'opacity-50 grayscale')}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400">
            <ImageIcon className="h-6 w-6" aria-hidden="true" />
          </div>
        )}

        {soldOut && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-800/90 px-3 py-1 text-[11px] font-semibold text-white">
            Hết hàng
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <h3
          className={cn(
            'line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5',
            soldOut ? 'text-zinc-500' : 'text-black'
          )}
        >
          {product.name}
        </h3>
        <p className={cn('mt-1.5 text-sm font-bold', soldOut ? 'text-zinc-400' : 'text-black')}>
          {formatVnd(product.price)}
        </p>

        {product.shopName && (
          <div className="mt-3 flex items-center gap-1.5 border-t border-[#f0f0f2] pt-2.5 text-[11px] text-zinc-500">
            <Store className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{product.shopName}</span>
          </div>
        )}
      </div>
    </Link>
  );
};

export const ProductCardSkeleton: React.FC = () => (
  <div
    data-testid="product-card-skeleton"
    className="rounded-2xl border border-[#e4e4e7] bg-white p-2.5 shadow-sm"
  >
    <div className="aspect-square w-full animate-pulse rounded-xl bg-zinc-100" />
    <div className="space-y-2 px-1 pb-1 pt-3">
      <div className="h-3.5 w-11/12 animate-pulse rounded bg-zinc-100" />
      <div className="h-3.5 w-2/3 animate-pulse rounded bg-zinc-100" />
      <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-100" />
    </div>
  </div>
);

export default ProductCard;
