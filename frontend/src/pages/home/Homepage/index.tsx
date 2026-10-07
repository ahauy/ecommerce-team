import { useEffect, useState } from 'react';
import HeroBanner from './components/HeroBanner';
import ProductFilterSidebar from './components/ProductFilterSidebar';
import ProductFilterDrawer from './components/ProductFilterDrawer';
import ProductToolbar from './components/ProductToolbar';
import ProductGrid from './components/ProductGrid';
import Pagination from '@/components/Pagination';
import { useCatalogFilters } from './hooks/useCatalogFilters';
import { useCatalogProducts } from './hooks/useCatalogProducts';

const Homepage = () => {
  const { filters, setFilters, clearFilters, activeCount } = useCatalogFilters();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isPending, isError, refetch, isPlaceholderData, unknownCategory, waitingCategory } =
    useCatalogProducts(filters);

  const filterValues = {
    category: filters.category,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
  };

  const items = unknownCategory ? [] : (data?.items ?? []);
  const total = unknownCategory ? 0 : (data?.total ?? 0);
  const totalPages = unknownCategory ? 0 : (data?.totalPages ?? 0);
  const limit = data?.limit || items.length;
  const from = total > 0 ? (filters.page - 1) * limit + 1 : 0;
  const to = total > 0 ? Math.min(from + items.length - 1, total) : 0;

  const isLoading = (isPending && !unknownCategory) || waitingCategory;
  const hasCriteria = activeCount > 0 || filters.q.trim() !== '';

  // URL còn ?page=99 nhưng kết quả chỉ có 2 trang → đưa về trang cuối.
  useEffect(() => {
    if (!isPlaceholderData && total > 0 && items.length === 0 && totalPages > 0 && filters.page > totalPages) {
      setFilters({ page: totalPages });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaceholderData, total, items.length, totalPages, filters.page]);

  const goToPage = (page: number) => {
    setFilters({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="component:Homepage w-full space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <HeroBanner />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Desktop: cột lọc trái 280px */}
        <ProductFilterSidebar value={filterValues} onChange={(patch) => setFilters(patch)} onClear={clearFilters} />

        {/* Lưới sản phẩm lấp đầy bên phải */}
        <section className="min-w-0 flex-1 space-y-5" aria-label="Danh sách sản phẩm">
          {filters.q.trim() && (
            <p data-testid="search-keyword" className="text-sm text-zinc-600">
              Kết quả tìm kiếm cho <strong className="font-semibold text-black">“{filters.q.trim()}”</strong>
            </p>
          )}

          <ProductToolbar
            activeFilterCount={activeCount}
            sort={filters.sort}
            onSortChange={(sort) => setFilters({ sort })}
            onOpenFilters={() => setDrawerOpen(true)}
            range={isLoading || isError ? undefined : { from, to, total }}
          />

          <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <ProductGrid
              products={items}
              isLoading={isLoading}
              isError={isError && !unknownCategory}
              onRetry={() => refetch()}
              hasCriteria={hasCriteria}
              onClearCriteria={() => setFilters({ q: '', category: '', minPrice: '', maxPrice: '' })}
            />
          </div>

          {!isLoading && !isError && (
            <Pagination page={filters.page} totalPages={totalPages} onPageChange={goToPage} className="pt-4" />
          )}
        </section>
      </div>

      {/* Mobile: Drawer trượt từ trái */}
      <ProductFilterDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        value={filterValues}
        onApply={(values) => setFilters(values)}
      />
    </div>
  );
};

export default Homepage;
