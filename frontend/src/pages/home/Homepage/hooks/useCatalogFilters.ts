import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'best_selling';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'best_selling', label: 'Bán chạy' },
];

export const RATING_OPTIONS = [4, 3] as const;

export interface CatalogFilters {
  q: string;
  /** slug danh mục ('' = tất cả) */
  category: string;
  minPrice: string;
  maxPrice: string;
  /** 4 | 3 | null */
  minRating: number | null;
  sort: SortOption;
}

/** Phần bộ lọc (không gồm từ khoá tìm kiếm và sắp xếp) — dùng chung cho Sidebar và Drawer. */
export type FilterValues = Pick<CatalogFilters, 'category' | 'minPrice' | 'maxPrice' | 'minRating'>;

export const EMPTY_FILTER_VALUES: FilterValues = {
  category: '',
  minPrice: '',
  maxPrice: '',
  minRating: null,
};

const digitsOnly = (value: string | null): string => (value && /^\d+$/.test(value) ? value : '');

/** Số lượng nhóm bộ lọc đang bật (khoảng giá tính là 1). */
export const countActiveFilters = (f: FilterValues): number =>
  (f.category ? 1 : 0) + (f.minPrice || f.maxPrice ? 1 : 0) + (f.minRating ? 1 : 0);

/**
 * Trạng thái bộ lọc catalog được lưu trên URL (?q=&category=&minPrice=&maxPrice=&rating=&sort=)
 * → chia sẻ/reload/back-forward đều giữ nguyên bộ lọc, và khớp với ô tìm kiếm ở Header.
 */
export const useCatalogFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<CatalogFilters>(() => {
    const rawRating = Number(searchParams.get('rating'));
    const rawSort = searchParams.get('sort') as SortOption | null;
    return {
      q: searchParams.get('q') || '',
      category: searchParams.get('category') || '',
      minPrice: digitsOnly(searchParams.get('minPrice')),
      maxPrice: digitsOnly(searchParams.get('maxPrice')),
      minRating: rawRating === 3 || rawRating === 4 ? rawRating : null,
      sort: SORT_OPTIONS.some((o) => o.value === rawSort) ? (rawSort as SortOption) : 'newest',
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<CatalogFilters>) => {
      const next = { ...filters, ...patch };
      const params = new URLSearchParams();
      if (next.q) params.set('q', next.q);
      if (next.category) params.set('category', next.category);
      if (next.minPrice) params.set('minPrice', next.minPrice);
      if (next.maxPrice) params.set('maxPrice', next.maxPrice);
      if (next.minRating) params.set('rating', String(next.minRating));
      if (next.sort !== 'newest') params.set('sort', next.sort);
      setSearchParams(params, { replace: true });
    },
    [filters, setSearchParams]
  );

  /** Xoá toàn bộ bộ lọc, giữ lại từ khoá tìm kiếm và cách sắp xếp. */
  const clearFilters = useCallback(() => setFilters(EMPTY_FILTER_VALUES), [setFilters]);

  const activeCount = countActiveFilters(filters);

  return { filters, setFilters, clearFilters, activeCount };
};

export default useCatalogFilters;
