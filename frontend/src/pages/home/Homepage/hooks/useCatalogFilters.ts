import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProductSortBy, ProductSortOrder } from '@/types/product.types';

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'name_asc';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'name_asc', label: 'Tên A → Z' },
];

/** Ánh xạ lựa chọn sắp xếp của UI sang `sortBy` / `order` của API. */
export const SORT_PARAMS: Record<SortOption, { sortBy: ProductSortBy; order: ProductSortOrder }> = {
  newest: { sortBy: 'createdAt', order: 'desc' },
  price_asc: { sortBy: 'price', order: 'asc' },
  price_desc: { sortBy: 'price', order: 'desc' },
  name_asc: { sortBy: 'name', order: 'asc' },
};

export const PAGE_SIZE = 12;

export interface CatalogFilters {
  q: string;
  /** slug danh mục ('' = tất cả) */
  category: string;
  minPrice: string;
  maxPrice: string;
  sort: SortOption;
  /** Trang hiện tại, bắt đầu từ 1. */
  page: number;
}

/** Phần bộ lọc (không gồm từ khoá, sắp xếp, trang) — dùng chung cho Sidebar và Drawer. */
export type FilterValues = Pick<CatalogFilters, 'category' | 'minPrice' | 'maxPrice'>;

export const EMPTY_FILTER_VALUES: FilterValues = {
  category: '',
  minPrice: '',
  maxPrice: '',
};

const digitsOnly = (value: string | null): string => (value && /^\d+$/.test(value) ? value : '');

const parsePage = (value: string | null): number => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
};

/** Số nhóm bộ lọc đang bật (khoảng giá tính là 1). */
export const countActiveFilters = (f: FilterValues): number =>
  (f.category ? 1 : 0) + (f.minPrice || f.maxPrice ? 1 : 0);

/**
 * Trạng thái bộ lọc catalog lưu trên URL (?q=&category=&minPrice=&maxPrice=&sort=&page=)
 * → chia sẻ / reload / back-forward đều giữ nguyên, và khớp với ô tìm kiếm ở Header.
 * Đổi bất kỳ bộ lọc nào ngoài `page` sẽ đưa người dùng về trang 1.
 */
export const useCatalogFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<CatalogFilters>(() => {
    const rawSort = searchParams.get('sort') as SortOption | null;
    return {
      q: searchParams.get('q') || '',
      category: searchParams.get('category') || '',
      minPrice: digitsOnly(searchParams.get('minPrice')),
      maxPrice: digitsOnly(searchParams.get('maxPrice')),
      sort: SORT_OPTIONS.some((o) => o.value === rawSort) ? (rawSort as SortOption) : 'newest',
      page: parsePage(searchParams.get('page')),
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<CatalogFilters>) => {
      const next: CatalogFilters = {
        ...filters,
        // Chỉ đổi trang thì giữ nguyên; đổi bộ lọc/sắp xếp thì về trang 1.
        page: 1,
        ...patch,
      };
      const params = new URLSearchParams();
      if (next.q) params.set('q', next.q);
      if (next.category) params.set('category', next.category);
      if (next.minPrice) params.set('minPrice', next.minPrice);
      if (next.maxPrice) params.set('maxPrice', next.maxPrice);
      if (next.sort !== 'newest') params.set('sort', next.sort);
      if (next.page > 1) params.set('page', String(next.page));
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
