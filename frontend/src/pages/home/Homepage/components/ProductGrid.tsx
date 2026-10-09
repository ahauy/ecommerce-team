import React from 'react';
import { AlertCircle, Package } from 'lucide-react';
import ProductCard, { ProductCardSkeleton } from '@/components/ProductCard';
import type { ProductSummary } from '@/types/product.types';
import { PAGE_SIZE } from '../hooks/useCatalogFilters';

interface ProductGridProps {
  products: ProductSummary[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  /** Có từ khoá / bộ lọc đang áp dụng → gợi ý xoá để xem thêm. */
  hasCriteria?: boolean;
  onClearCriteria?: () => void;
}

const gridClass = 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4';

const StateBox: React.FC<{
  testId: string;
  icon: React.ReactNode;
  title: string;
  hint?: string;
  action?: { label: string; onClick: () => void };
}> = ({ testId, icon, title, hint, action }) => (
  <div
    data-testid={testId}
    className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-hairline-light bg-white p-12 text-center shadow-card"
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">{icon}</div>
    <p className="text-sm font-semibold text-black">{title}</p>
    {hint && <p className="max-w-sm text-xs text-zinc-500">{hint}</p>}
    {action && (
      <button
        type="button"
        onClick={action.onClick}
        className="mt-1 h-10 rounded-full bg-black px-6 text-xs font-semibold text-white transition-all duration-150 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
      >
        {action.label}
      </button>
    )}
  </div>
);

/** Lưới sản phẩm responsive: đủ 4 trạng thái — đang tải, lỗi, rỗng, có dữ liệu. */
const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  isError,
  onRetry,
  hasCriteria,
  onClearCriteria,
}) => {
  if (isLoading) {
    return (
      <ul data-testid="product-grid-loading" aria-busy="true" className={gridClass}>
        {Array.from({ length: PAGE_SIZE }, (_, i) => (
          <li key={i}>
            <ProductCardSkeleton />
          </li>
        ))}
      </ul>
    );
  }

  if (isError) {
    return (
      <StateBox
        testId="product-grid-error"
        icon={<AlertCircle className="h-6 w-6" />}
        title="Không thể tải danh sách sản phẩm"
        hint="Đã có lỗi khi kết nối tới máy chủ. Vui lòng thử lại."
        action={onRetry ? { label: 'Thử lại', onClick: onRetry } : undefined}
      />
    );
  }

  if (products.length === 0) {
    return (
      <StateBox
        testId="product-grid-empty"
        icon={<Package className="h-6 w-6" />}
        title={hasCriteria ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào'}
        hint={
          hasCriteria
            ? 'Thử đổi từ khoá, nới khoảng giá hoặc chọn danh mục khác.'
            : 'Các gian hàng chưa đăng bán sản phẩm nào. Vui lòng quay lại sau.'
        }
        action={hasCriteria && onClearCriteria ? { label: 'Xóa bộ lọc', onClick: onClearCriteria } : undefined}
      />
    );
  }

  return (
    <ul data-testid="product-grid" className={gridClass}>
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
};

export default ProductGrid;
