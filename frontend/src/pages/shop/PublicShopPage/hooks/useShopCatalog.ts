import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { categoryService } from '@/services/category.service';
import { useProducts } from '@/hooks/queries/useProducts';
import type { ProductListParams, ProductSortBy, ProductSortOrder } from '@/types/product.types';

export type ShopSortOption = 'newest' | 'price_asc' | 'price_desc' | 'name_asc';

export const SHOP_SORT_OPTIONS: { value: ShopSortOption; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá: Thấp đến Cao' },
  { value: 'price_desc', label: 'Giá: Cao đến Thấp' },
  { value: 'name_asc', label: 'Tên A → Z' },
];

export const SHOP_SORT_PARAMS: Record<
  ShopSortOption,
  { sortBy: ProductSortBy; order: ProductSortOrder }
> = {
  newest: { sortBy: 'createdAt', order: 'desc' },
  price_asc: { sortBy: 'price', order: 'asc' },
  price_desc: { sortBy: 'price', order: 'desc' },
  name_asc: { sortBy: 'name', order: 'asc' },
};

export const SHOP_PAGE_SIZE = 16;

export interface ShopCatalogFilters {
  category: string;
  sort: ShopSortOption;
  page: number;
}

const parsePage = (value: string | null): number => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
};

export const useShopCatalog = (sellerId: string, hasProducts: boolean) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<ShopCatalogFilters>(() => {
    const rawSort = searchParams.get('sort') as ShopSortOption | null;
    return {
      category: searchParams.get('category') || '',
      sort: SHOP_SORT_OPTIONS.some((o) => o.value === rawSort)
        ? (rawSort as ShopSortOption)
        : 'newest',
      page: parsePage(searchParams.get('page')),
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<ShopCatalogFilters>) => {
      const next: ShopCatalogFilters = {
        ...filters,
        page: 1,
        ...patch,
      };
      const params = new URLSearchParams();
      if (next.category) params.set('category', next.category);
      if (next.sort !== 'newest') params.set('sort', next.sort);
      if (next.page > 1) params.set('page', String(next.page));
      setSearchParams(params, { replace: true });
    },
    [filters, setSearchParams]
  );

  const categoriesQuery = categoryService.useCategories();
  const categories = categoriesQuery.data;

  const resolved = useMemo(() => {
    if (!filters.category) return { categoryId: undefined, unknown: false, waiting: false };
    if (!categories) {
      return { categoryId: undefined, unknown: false, waiting: !categoriesQuery.isError };
    }
    const found = categories.find((c) => c.slug === filters.category);
    return { categoryId: found?.id, unknown: !found, waiting: false };
  }, [filters.category, categories, categoriesQuery.isError]);

  const params = useMemo<ProductListParams>(
    () => ({
      sellerId,
      page: filters.page,
      limit: SHOP_PAGE_SIZE,
      categoryId: resolved.categoryId,
      ...SHOP_SORT_PARAMS[filters.sort],
    }),
    [sellerId, filters.page, filters.sort, resolved.categoryId]
  );

  const enabled = Boolean(sellerId) && hasProducts && !resolved.waiting && !resolved.unknown;
  const query = useProducts(params, enabled);

  const items = resolved.unknown ? [] : (query.data?.items ?? []);
  const total = resolved.unknown ? 0 : (query.data?.total ?? 0);
  const totalPages = resolved.unknown ? 0 : (query.data?.totalPages ?? 0);
  const isLoading = (query.isPending && !resolved.unknown) || resolved.waiting;
  const isError = query.isError && !resolved.unknown;

  useEffect(() => {
    if (
      !query.isPlaceholderData &&
      total > 0 &&
      items.length === 0 &&
      totalPages > 0 &&
      filters.page > totalPages
    ) {
      setFilters({ page: totalPages });
    }
  }, [query.isPlaceholderData, total, items.length, totalPages, filters.page, setFilters]);

  return {
    filters,
    setFilters,
    items,
    total,
    totalPages,
    isLoading,
    isError,
    isPlaceholderData: query.isPlaceholderData,
    refetch: query.refetch,
  };
};

export default useShopCatalog;
