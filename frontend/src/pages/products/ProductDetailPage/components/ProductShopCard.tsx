import React from 'react';
import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import { shopPath } from '@/consts/baseUrl';
import { formatMonthYear } from '@/helpers/format';
import { usePublicShop } from '@/hooks/queries/usePublicShop';

interface ProductShopCardProps {
  sellerId: string;
  shopName: string | null;
  isOwner: boolean;
}

/** Thẻ gian hàng: tên, ngày tham gia, số sản phẩm, nút "Xem gian hàng". */
const ProductShopCard: React.FC<ProductShopCardProps> = ({ sellerId, shopName, isOwner }) => {
  const { data: shop } = usePublicShop(sellerId, !!sellerId);

  const name = shop?.shopName ?? shopName ?? 'Gian hàng';
  const joined = formatMonthYear(shop?.joinedAt);
  const meta = [joined && `Tham gia từ ${joined}`, shop && `${shop.productCount} sản phẩm`].filter(Boolean).join(' · ');

  return (
    <div
      data-testid="product-shop-card"
      className="flex items-center gap-3 rounded-2xl border border-hairline-light bg-white p-3.5"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          isOwner ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-700'
        }`}
        aria-hidden="true"
      >
        <Store className="h-[18px] w-[18px]" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-black">{name}</p>
        {isOwner && (
          <span className="mt-0.5 inline-block rounded-full bg-aloe px-2 py-0.5 text-[10px] font-semibold text-black">
            Gian hàng của bạn
          </span>
        )}
        {meta && <p className="mt-0.5 truncate text-[11px] text-zinc-500 tabular-nums">{meta}</p>}
      </div>

      {sellerId && (
        <Link
          to={shopPath(sellerId)}
          className="inline-flex h-9 shrink-0 items-center rounded-full border border-hairline-light bg-white px-4 text-xs font-semibold text-black transition-colors duration-150 hover:border-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          Xem gian hàng
        </Link>
      )}
    </div>
  );
};

export default ProductShopCard;
