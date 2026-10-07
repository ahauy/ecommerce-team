import { useState } from "react";
import ProductFilterSidebar from "./components/ProductFilterSidebar";
import ProductFilterDrawer from "./components/ProductFilterDrawer";
import ProductToolbar from "./components/ProductToolbar";
import ProductGrid, { type CatalogProduct } from "./components/ProductGrid";
import { useCatalogFilters } from "./hooks/useCatalogFilters";

// TODO(US-PRD-002): thay bằng dữ liệu từ API danh sách sản phẩm công khai,
// truyền `filters` (q, category, minPrice, maxPrice, minRating, sort) làm query.
const PRODUCTS: CatalogProduct[] = [];

const Homepage = () => {
  const { filters, setFilters, clearFilters, activeCount } = useCatalogFilters();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filterValues = {
    category: filters.category,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    minRating: filters.minRating,
  };

  return (
    <div className="component:Homepage w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Desktop: cột lọc trái 280px */}
        <ProductFilterSidebar
          value={filterValues}
          onChange={(patch) => setFilters(patch)}
          onClear={clearFilters}
        />

        {/* Lưới sản phẩm lấp đầy bên phải */}
        <section className="min-w-0 flex-1 space-y-5" aria-label="Danh sách sản phẩm">
          <ProductToolbar
            activeFilterCount={activeCount}
            sort={filters.sort}
            onSortChange={(sort) => setFilters({ sort })}
            onOpenFilters={() => setDrawerOpen(true)}
            resultCount={PRODUCTS.length > 0 ? PRODUCTS.length : undefined}
          />
          <ProductGrid products={PRODUCTS} />
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
