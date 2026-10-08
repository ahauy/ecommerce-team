import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import ProductFilterPanel from './ProductFilterPanel';
import { countActiveFilters, type FilterValues } from '../hooks/useCatalogFilters';

interface ProductFilterSidebarProps {
  value: FilterValues;
  onChange: (patch: Partial<FilterValues>) => void;
  onClear: () => void;
}

/** Cột lọc cố định 280px bên trái (chỉ hiện từ 1024px trở lên). */
const ProductFilterSidebar: React.FC<ProductFilterSidebarProps> = ({ value, onChange, onClear }) => (
  <aside
    data-testid="product-filter-sidebar"
    aria-label="Bộ lọc tìm kiếm"
    className="sticky top-24 hidden w-[280px] shrink-0 self-start rounded-2xl border border-[#e4e4e7] bg-white p-5 shadow-sm lg:block"
  >
    <div className="mb-5 flex items-center justify-between border-b border-[#ececef] pb-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-black">
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Bộ lọc tìm kiếm
      </h2>
      <button
        type="button"
        onClick={onClear}
        disabled={countActiveFilters(value) === 0}
        className="text-xs text-zinc-500 transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-zinc-500"
      >
        Thiết lập lại
      </button>
    </div>
    <ProductFilterPanel value={value} onChange={onChange} />
  </aside>
);

export default ProductFilterSidebar;
