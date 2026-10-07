import React from 'react';
import ProductFilterPanel from './ProductFilterPanel';
import type { FilterValues } from '../hooks/useCatalogFilters';

interface ProductFilterSidebarProps {
  value: FilterValues;
  onChange: (patch: Partial<FilterValues>) => void;
  onClear: () => void;
}

/** Cột lọc cố định 280px bên trái (chỉ hiện từ 1024px trở lên). */
const ProductFilterSidebar: React.FC<ProductFilterSidebarProps> = (props) => (
  <aside
    data-testid="product-filter-sidebar"
    aria-label="Bộ lọc sản phẩm"
    className="sticky top-24 hidden max-h-[calc(100vh-7rem)] w-[280px] shrink-0 self-start overflow-y-auto rounded-2xl border border-[#e4e4e7] bg-white p-5 shadow-sm lg:block"
  >
    <ProductFilterPanel {...props} />
  </aside>
);

export default ProductFilterSidebar;
