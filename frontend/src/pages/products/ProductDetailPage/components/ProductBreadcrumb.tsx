import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import BaseUrl from '@/consts/baseUrl';

interface ProductBreadcrumbProps {
  category: { name: string; slug?: string | null } | null;
  productName: string;
}

const Sep = () => <ChevronRight className="h-3 w-3 shrink-0 text-zinc-400" aria-hidden="true" />;

const ProductBreadcrumb: React.FC<ProductBreadcrumbProps> = ({ category, productName }) => (
  <nav aria-label="Đường dẫn" className="flex min-w-0 items-center gap-2 text-[11px] text-zinc-500">
    <Link to={BaseUrl.Homepage} className="shrink-0 hover:text-black">
      Trang chủ
    </Link>
    {category && (
      <>
        <Sep />
        <Link
          to={category.slug ? `${BaseUrl.Homepage}?category=${encodeURIComponent(category.slug)}` : BaseUrl.Homepage}
          className="shrink-0 hover:text-black"
        >
          {category.name}
        </Link>
      </>
    )}
    <Sep />
    <span aria-current="page" className="truncate font-semibold text-black">
      {productName}
    </span>
  </nav>
);

export default ProductBreadcrumb;
