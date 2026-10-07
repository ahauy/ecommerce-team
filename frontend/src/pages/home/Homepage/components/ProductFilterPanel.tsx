import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { categoryService } from '@/services/category.service';
import { cn } from '@/lib/utils';
import {
  RATING_OPTIONS,
  countActiveFilters,
  type FilterValues,
} from '../hooks/useCatalogFilters';

interface ProductFilterPanelProps {
  value: FilterValues;
  onChange: (patch: Partial<FilterValues>) => void;
  onClear: () => void;
  /**
   * true  → khoảng giá cập nhật ngay khi gõ (dùng trong Drawer, có nút "Áp dụng" riêng).
   * false → có nút "Lọc" riêng cho khoảng giá (dùng ở Sidebar desktop).
   */
  instantPrice?: boolean;
}

const BlockTitle: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{children}</h3>
);

const inputClass =
  'h-10 w-full rounded-lg border border-[#e4e4e7] bg-white px-3 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none';

/** Nội dung bộ lọc dùng chung cho Sidebar (desktop) và Drawer (mobile). */
const ProductFilterPanel: React.FC<ProductFilterPanelProps> = ({
  value,
  onChange,
  onClear,
  instantPrice = false,
}) => {
  const { data: categories = [], isLoading, isError, refetch } = categoryService.useCategories();

  // Giá nhập dở (chưa bấm "Lọc") — đồng bộ lại khi giá trị thật đổi (vd. Xóa bộ lọc).
  const [minDraft, setMinDraft] = useState(value.minPrice);
  const [maxDraft, setMaxDraft] = useState(value.maxPrice);
  const [priceError, setPriceError] = useState('');

  useEffect(() => {
    setMinDraft(value.minPrice);
    setMaxDraft(value.maxPrice);
    setPriceError('');
  }, [value.minPrice, value.maxPrice]);

  const sanitize = (raw: string) => raw.replace(/\D/g, '');

  const handlePriceInput = (field: 'minPrice' | 'maxPrice', raw: string) => {
    const next = sanitize(raw);
    if (field === 'minPrice') setMinDraft(next);
    else setMaxDraft(next);
    if (instantPrice) onChange({ [field]: next });
  };

  const applyPrice = () => {
    if (minDraft && maxDraft && Number(minDraft) > Number(maxDraft)) {
      setPriceError('Giá "từ" phải nhỏ hơn hoặc bằng giá "đến".');
      return;
    }
    setPriceError('');
    onChange({ minPrice: minDraft, maxPrice: maxDraft });
  };

  const hasActive = countActiveFilters(value) > 0;

  return (
    <div className="space-y-7" style={{ fontFeatureSettings: '"ss03"' }}>
      {/* Khối 1: Danh mục */}
      <section aria-label="Danh mục sản phẩm">
        <BlockTitle>Danh mục sản phẩm</BlockTitle>
        {isLoading ? (
          <div data-testid="filter-category-loading" className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded-full bg-zinc-200" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex items-center gap-2 text-xs text-red-600">
            <span>Không thể tải danh mục.</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full border border-red-200 bg-red-50 px-3 py-1 font-medium text-red-700 hover:bg-red-100"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <ul className="space-y-1">
            {[{ id: '__all', slug: '', name: 'Tất cả' }, ...categories].map((cat) => {
              const selected = value.category === cat.slug;
              return (
                <li key={cat.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onChange({ category: cat.slug })}
                    className={cn(
                      'flex min-h-[36px] w-full items-center rounded-full px-4 py-1.5 text-left text-sm transition-colors',
                      selected
                        ? 'bg-[#c1fbd4] font-semibold text-black'
                        : 'text-zinc-700 hover:bg-white hover:text-black'
                    )}
                  >
                    <span className="truncate">{cat.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Khối 2: Khoảng giá */}
      <section aria-label="Khoảng giá">
        <BlockTitle>Khoảng giá (₫)</BlockTitle>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            aria-label="Giá từ"
            placeholder="Từ"
            value={minDraft}
            onChange={(e) => handlePriceInput('minPrice', e.target.value)}
            className={inputClass}
          />
          <span className="text-zinc-400">–</span>
          <input
            type="text"
            inputMode="numeric"
            aria-label="Giá đến"
            placeholder="Đến"
            value={maxDraft}
            onChange={(e) => handlePriceInput('maxPrice', e.target.value)}
            className={inputClass}
          />
        </div>
        {priceError && (
          <p role="alert" className="mt-2 text-xs font-medium text-red-600">
            {priceError}
          </p>
        )}
        {!instantPrice && (
          <button
            type="button"
            onClick={applyPrice}
            className="mt-3 h-10 w-full rounded-full bg-black text-xs font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Lọc
          </button>
        )}
      </section>

      {/* Khối 3: Đánh giá sao */}
      <section aria-label="Đánh giá">
        <BlockTitle>Đánh giá</BlockTitle>
        <ul className="space-y-1">
          {RATING_OPTIONS.map((rating) => {
            const selected = value.minRating === rating;
            return (
              <li key={rating}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange({ minRating: selected ? null : rating })}
                  className={cn(
                    'flex min-h-[36px] w-full items-center gap-2 rounded-full px-4 py-1.5 text-left text-sm transition-colors',
                    selected
                      ? 'bg-[#c1fbd4] font-semibold text-black'
                      : 'text-zinc-700 hover:bg-white hover:text-black'
                  )}
                >
                  <span className="flex" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={cn(
                          'h-4 w-4',
                          n <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'
                        )}
                      />
                    ))}
                  </span>
                  <span>từ {rating} sao</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Khối 4: Xóa bộ lọc */}
      <button
        type="button"
        onClick={onClear}
        disabled={!hasActive}
        className="h-10 w-full rounded-full border border-[#e4e4e7] bg-white text-xs font-semibold text-zinc-700 transition-colors hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        Xóa tất cả bộ lọc
      </button>
    </div>
  );
};

export default ProductFilterPanel;
