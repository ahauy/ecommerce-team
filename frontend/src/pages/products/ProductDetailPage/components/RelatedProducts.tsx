import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard, { ProductCardSkeleton } from '@/components/ProductCard';
import { shopPath } from '@/consts/baseUrl';
import { RELATED_PRODUCTS_LIMIT } from '@/consts/product';
import { useProducts } from '@/hooks/queries/useProducts';
import { usePublicShop } from '@/hooks/queries/usePublicShop';

interface RelatedProductsProps {
  sellerId: string;
  currentProductId: string;
  isOwner: boolean;
}

/** "Sản phẩm khác của gian hàng": lấy SP công khai cùng người bán, bỏ sản phẩm đang xem. */
const RelatedProducts: React.FC<RelatedProductsProps> = ({ sellerId, currentProductId, isOwner }) => {
  // Lấy dư 1 để sau khi loại sản phẩm hiện tại vẫn đủ RELATED_PRODUCTS_LIMIT.
  const { data, isPending } = useProducts({ sellerId, limit: RELATED_PRODUCTS_LIMIT + 1 }, !!sellerId);
  const { data: shop } = usePublicShop(sellerId, !!sellerId);

  const related = (data?.items ?? []).filter((p) => p.id !== currentProductId).slice(0, RELATED_PRODUCTS_LIMIT);

  if (!isPending && related.length === 0) return null;

  return (
    <section aria-labelledby="related-title" data-testid="related-products" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 id="related-title" className="text-sm font-semibold text-black">
            Sản phẩm khác của gian hàng
          </h2>
          {isOwner && (
            <span className="rounded-full bg-aloe px-2 py-0.5 text-[10px] font-semibold text-black">
              Gian hàng của bạn
            </span>
          )}
        </div>
        {sellerId && (
          <Link
            to={shopPath(sellerId)}
            className="inline-flex items-center gap-1 text-xs font-medium text-black hover:underline"
          >
            {shop ? `Xem tất cả ${shop.productCount} sản phẩm` : 'Xem tất cả'}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {isPending
          ? Array.from({ length: RELATED_PRODUCTS_LIMIT }, (_, i) => (
              <li key={i}>
                <ProductCardSkeleton />
              </li>
            ))
          : related.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
      </ul>
    </section>
  );
};

export default RelatedProducts;
