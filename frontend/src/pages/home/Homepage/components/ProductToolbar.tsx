import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { SORT_OPTIONS, type SortOption } from '../hooks/useCatalogFilters';

interface ProductToolbarProps {
  activeFilterCount: number;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onOpenFilters: () => void;
  /** Khoảng đang hiển thị, vd. { from: 1, to: 12, total: 312 } — ẩn khi chưa có dữ liệu. */
  range?: { from: number; to: number; total: number };
}

const ProductToolbar: React.FC<ProductToolbarProps> = ({
  activeFilterCount,
  sort,
  onSortChange,
  onOpenFilters,
  range,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline-light pb-4">
    <div className="flex items-center gap-3">
      {/* Mobile: nút mở Drawer */}
      <button
        type="button"
        onClick={onOpenFilters}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-hairline-light bg-white px-4 text-xs font-semibold text-zinc-800 shadow-xs transition-colors duration-150 hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span>{activeFilterCount > 0 ? <>Bộ lọc (<span className="tabular-nums">{activeFilterCount}</span>)</> : 'Bộ lọc'}</span>
      </button>

      {range && range.total > 0 && (
        <p data-testid="product-range" className="text-sm text-zinc-600">
          Hiển thị <strong className="font-semibold text-black tabular-nums">{range.from}-{range.to}</strong> /{' '}
          <strong className="font-semibold text-black tabular-nums">{range.total}</strong> sản phẩm
        </p>
      )}
    </div>

    <label className="flex items-center gap-2 text-xs text-zinc-500">
      <span className="hidden sm:inline">Sắp xếp theo:</span>
      <select
        aria-label="Sắp xếp sản phẩm"
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="h-10 rounded-full border border-hairline-light bg-white px-4 text-xs font-medium text-black transition-colors duration-150 focus:border-black focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
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
