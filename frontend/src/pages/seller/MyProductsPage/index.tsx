import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { userService } from '@/services/user.service';
import { categoryService } from '@/services/category.service';
import { useMyProductsQuery } from './hooks/useMyProductsQuery';
import { useToggleProductActive } from './hooks/useToggleProductActive';
import { useDeleteProduct } from './hooks/useDeleteProduct';
import { ProductFilterChips } from './components/ProductFilterChips';
import { ProductSearchInput } from './components/ProductSearchInput';
import { ProductTable } from './components/ProductTable';
import { EmptyProductsState } from './components/EmptyProductsState';
import { ShopNotSetupBanner } from './components/ShopNotSetupBanner';
import { DeleteProductDialog } from './dialogs/DeleteProductDialog';
import { OwnerProduct, ProductStatusFilter } from './types';
import BaseUrl from '@/consts/baseUrl';

const MyProductsPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>('all');
  const [productToDelete, setProductToDelete] = useState<OwnerProduct | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Profile to verify shop setup
  const { data: profile, isLoading: isProfileLoading } = userService.useGetProfile();
  const hasShop = Boolean(profile?.shop?.shopName);

  // Products query
  const { data: productsData, isLoading: isProductsLoading } = useMyProductsQuery(
    { page: currentPage, limit: 20 },
    hasShop
  );

  // Categories map for labels
  const { data: categories = [] } = categoryService.useCategories();
  const categoriesMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((cat) => {
      map[cat.id] = cat.name;
    });
    return map;
  }, [categories]);

  // Mutations
  const toggleMutation = useToggleProductActive();
  const deleteMutation = useDeleteProduct();

  const allItems = useMemo(() => productsData?.items || [], [productsData?.items]);

  // Filter and search
  const filteredProducts = useMemo(() => {
    return allItems.filter((product) => {
      // Status filter
      let matchStatus = true;
      if (statusFilter === 'selling') {
        matchStatus = product.isActive && !product.isBlocked;
      } else if (statusFilter === 'hidden') {
        matchStatus = !product.isActive && !product.isBlocked;
      } else if (statusFilter === 'locked') {
        matchStatus = product.isBlocked;
      }

      // Search query
      const matchSearch =
        !searchQuery.trim() ||
        product.name.toLowerCase().includes(searchQuery.trim().toLowerCase());

      return matchStatus && matchSearch;
    });
  }, [allItems, statusFilter, searchQuery]);

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      all: allItems.length,
      selling: allItems.filter((p) => p.isActive && !p.isBlocked).length,
      hidden: allItems.filter((p) => !p.isActive && !p.isBlocked).length,
      locked: allItems.filter((p) => p.isBlocked).length,
    };
  }, [allItems]);

  const handleToggleActive = async (
    id: string,
    currentActive: boolean,
    isBlocked: boolean
  ) => {
    if (isBlocked) return;
    try {
      setTogglingId(id);
      await toggleMutation.mutateAsync({ id, isActive: !currentActive });
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    setProductToDelete(null);
  };

  if (isProfileLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      data-testid="my-products-page"
      className="flex flex-col w-full min-w-0"
      style={{ fontFeatureSettings: '"ss03"' }}
    >
      {/* If shop is not setup, show alert banner */}
      {!hasShop && (
        <div className="mb-6">
          <ShopNotSetupBanner />
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-black">
            Sản phẩm của tôi
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Quản lý các sản phẩm đang đăng bán của gian hàng.
          </p>
        </div>
        {hasShop && (
          <div className="shrink-0">
            <Link
              to={BaseUrl.SellerProductCreate}
              className="h-10 px-5 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm sản phẩm</span>
            </Link>
          </div>
        )}
      </div>

      {/* Toolbar: Search + Filter Chips */}
      {hasShop && allItems.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <ProductSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <ProductFilterChips
            currentFilter={statusFilter}
            onFilterChange={setStatusFilter}
            counts={statusCounts}
          />
        </div>
      )}

      {/* Content State */}
      {isProductsLoading ? (
        <div className="flex h-64 w-full items-center justify-center bg-white rounded-xl border border-hairline-light">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
        </div>
      ) : allItems.length === 0 ? (
        <EmptyProductsState />
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl border border-hairline-light p-8 text-center text-zinc-500 text-xs">
          Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        <>
          <ProductTable
            products={filteredProducts}
            categoriesMap={categoriesMap}
            onToggleActive={handleToggleActive}
            onDeleteClick={setProductToDelete}
            isTogglingId={togglingId}
          />

          {/* Pagination if multiple pages */}
          {productsData && productsData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 mb-4">
              {Array.from({ length: productsData.totalPages }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-colors ${
                      currentPage === p
                        ? 'bg-black text-white shadow-xs'
                        : 'bg-white border border-hairline-light text-black hover:border-zinc-400'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteProductDialog
        isOpen={Boolean(productToDelete)}
        product={productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};

export default MyProductsPage;
