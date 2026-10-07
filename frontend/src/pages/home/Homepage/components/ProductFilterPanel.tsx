import React, { useEffect, useState } from 'react';
import { categoryService } from '@/services/category.service';
import { cn } from '@/lib/utils';
import type { FilterValues } from '../hooks/useCatalogFilters';

interface ProductFilterPanelProps {
  value: FilterValues;
  onChange: (patch: Partial<FilterValues>) => void;
  /**
   * true  → khoảng giá cập nhật ngay khi gõ (Drawer đã có nút "Áp dụng" riêng).
   * false → có nút "Áp dụng" riêng cho khoảng giá (Sidebar desktop).
   */
  instantPrice?: boolean;
}

const BlockTitle: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{children}</h3>
);

const digits = (raw: string) => raw.replace(/\D/g, '');
const withDots = (raw: string) => (raw ? Number(raw).toLocaleString('vi-VN') : '');

const PriceInput: React.FC<{
  label: string;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
}> = ({ label, placeholder, value, onChange }) => (
  <div className="relative min-w-0 flex-1">
    <input
      type="text"
      inputMode="numeric"
      aria-label={label}
      placeholder={placeholder}
      value={withDots(value)}
      onChange={(e) => onChange(digits(e.target.value))}
      className="h-10 w-full rounded-lg border border-[#e4e4e7] bg-white pl-3 pr-7 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none"
    />
    <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
      ₫
    </span>
  </div>
);

/** Nội dung bộ lọc dùng chung cho Sidebar (desktop) và Drawer (mobile). */
const ProductFilterPanel: React.FC<ProductFilterPanelProps> = ({ value, onChange, instantPrice = false }) => {
  const { data: categories = [], isLoading, isError, refetch } = categoryService.useCategories();

  // Giá nhập dở (chưa bấm "Áp dụng") — đồng bộ lại khi giá trị thật đổi (vd. Thiết lập lại).
  const [minDraft, setMinDraft] = useState(value.minPrice);
  const [maxDraft, setMaxDraft] = useState(value.maxPrice);
  const [priceError, setPriceError] = useState('');

  useEffect(() => {
    setMinDraft(value.minPrice);
    setMaxDraft(value.maxPrice);
    setPriceError('');
  }, [value.minPrice, value.maxPrice]);

  const handlePriceInput = (field: 'minPrice' | 'maxPrice', next: string) => {
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

  const options = [{ id: '__all', slug: '', name: 'Tất cả danh mục', productCount: undefined as number | undefined }, ...categories];

  return (
    <div className="space-y-6">
      <section aria-label="Danh mục">
        <BlockTitle>Danh mục</BlockTitle>
        {isLoading ? (
          <div data-testid="filter-category-loading" className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-7 animate-pulse rounded-full bg-zinc-100" />
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
          <div role="radiogroup" aria-label="Danh mục" className="space-y-0.5">
            {options.map((cat) => {
              const selected = value.category === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ category: cat.slug })}
                  className={cn(
                    'flex min-h-[34px] w-full items-center gap-3 rounded-lg px-1 py-1.5 text-left text-[13px] transition-colors hover:text-black',
                    selected ? 'font-semibold text-black' : 'text-zinc-600'
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                      selected ? 'border-black' : 'border-zinc-300'
                    )}
                  >
                    {selected && <span className="h-2 w-2 rounded-full bg-black" />}
                  </span>
                  <span className="flex-1 truncate">{cat.name}</span>
                  {typeof cat.productCount === 'number' && (
                    <span className="text-xs font-normal text-zinc-400">{cat.productCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <div className="border-t border-[#ececef]" />

      <section aria-label="Khoảng giá">
        <BlockTitle>Khoảng giá</BlockTitle>
        <div className="flex items-center gap-2">
          <PriceInput label="Giá từ" placeholder="0" value={minDraft} onChange={(v) => handlePriceInput('minPrice', v)} />
          <span aria-hidden="true" className="text-zinc-400">–</span>
          <PriceInput label="Giá đến" placeholder="Tối đa" value={maxDraft} onChange={(v) => handlePriceInput('maxPrice', v)} />
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
            className="mt-3 h-11 w-full rounded-full bg-black text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Áp dụng
          </button>
        )}
      </section>
    </div>
  );
};

export default ProductFilterPanel;
