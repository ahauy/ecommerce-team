import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { SORT_OPTIONS, type SortOption } from '../hooks/useCatalogFilters';

interface ProductToolbarProps {
  activeFilterCount: number;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onOpenFilters: () => void;
  /** Tổng số kết quả — chỉ hiển thị khi đã có dữ liệu thật từ API. */
  resultCount?: number;
}

const ProductToolbar: React.FC<ProductToolbarProps> = ({
  activeFilterCount,
  sort,
  onSortChange,
  onOpenFilters,
  resultCount,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      {/* Mobile: nút mở Drawer */}
      <button
        type="button"
        onClick={onOpenFilters}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-[#e4e4e7] bg-white px-4 text-xs font-semibold text-zinc-800 shadow-xs transition-colors hover:border-black lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span>{activeFilterCount > 0 ? `Bộ lọc (${activeFilterCount})` : 'Bộ lọc'}</span>
      </button>

      {resultCount !== undefined && (
        <p className="text-sm text-zinc-600">Hiển thị {resultCount} sản phẩm</p>
      )}
    </div>

    <label className="flex items-center gap-2 text-xs text-zinc-500">
      <span className="hidden sm:inline">Sắp xếp:</span>
      <select
        aria-label="Sắp xếp sản phẩm"
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="h-10 rounded-full border border-[#e4e4e7] bg-white px-4 text-xs font-medium text-black focus:border-black focus:outline-none"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  </div>
);

export default ProductToolbar;
