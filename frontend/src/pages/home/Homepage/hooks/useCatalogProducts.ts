import { useMemo } from 'react';
import { categoryService } from '@/services/category.service';
import { useProducts } from '@/hooks/queries/useProducts';
import type { ProductListParams } from '@/types/product.types';
import { PAGE_SIZE, SORT_PARAMS, type CatalogFilters } from './useCatalogFilters';

/**
 * Chuyển bộ lọc trên URL thành query của `GET /products` và gọi API.
 * URL dùng slug danh mục (đẹp, chia sẻ được); API cần `categoryId` → tra từ danh sách danh mục.
 */
export const useCatalogProducts = (filters: CatalogFilters) => {
  const categoriesQuery = categoryService.useCategories();
  const categories = categoriesQuery.data;

  const resolved = useMemo(() => {
    if (!filters.category) return { categoryId: undefined, unknown: false, waiting: false };
    if (!categories) return { categoryId: undefined, unknown: false, waiting: !categoriesQuery.isError };
    const found = categories.find((c) => c.slug === filters.category);
    return { categoryId: found?.id, unknown: !found, waiting: false };
  }, [filters.category, categories, categoriesQuery.isError]);

  const params = useMemo<ProductListParams>(
    () => ({
      page: filters.page,
      limit: PAGE_SIZE,
      search: filters.q.trim() || undefined,
      categoryId: resolved.categoryId,
      minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      ...SORT_PARAMS[filters.sort],
    }),
    [filters, resolved.categoryId]
  );

  const query = useProducts(params, !resolved.waiting && !resolved.unknown);

  return {
    ...query,
    /** Slug trên URL không khớp danh mục nào → coi như không có sản phẩm. */
    unknownCategory: resolved.unknown,
    /** Đang chờ danh sách danh mục để biết categoryId. */
    waitingCategory: resolved.waiting,
  };
};

export default useCatalogProducts;
