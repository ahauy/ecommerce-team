import React, { useState, useMemo } from 'react';
import { Plus, Search, AlertCircle, RefreshCw } from 'lucide-react';
import type { AdminCategoryItem } from '@/types/category.types';
import { adminCategoryService } from './services/admin-category.service';
import AdminCategoryListTable from './components/AdminCategoryListTable';
import CategoryFormDrawer from './components/CategoryFormDrawer';
import DeleteWarningDialog from './dialogs/DeleteWarningDialog';
import { showError, showSuccess } from '@/helpers/toast';

type FilterStatus = 'all' | 'active' | 'hidden';

export const AdminCategoryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategoryItem | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategoryItem | null>(null);

  const {
    data: categories = [],
    isLoading,
    isError,
    error,
    refetch,
  } = adminCategoryService.useAdminCategories();

  const deleteMutation = adminCategoryService.useDeleteCategory();

  // ── Filter & Search Logic ───────────────────────────────────────────────────
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchSearch =
        cat.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        cat.slug.toLowerCase().includes(searchTerm.toLowerCase().trim());

      if (!matchSearch) return false;
      if (statusFilter === 'active') return cat.isActive;
      if (statusFilter === 'hidden') return !cat.isActive;
      return true;
    });
  }, [categories, searchTerm, statusFilter]);

  // ── Stats Summary ───────────────────────────────────────────────────────────
  const totalCount = categories.length;
  const activeCount = useMemo(() => categories.filter((c) => c.isActive).length, [categories]);
  const hiddenCount = totalCount - activeCount;
  const totalProducts = useMemo(
    () => categories.reduce((sum, c) => sum + (c.productCount ?? 0), 0),
    [categories],
  );

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleOpenCreateDrawer = () => {
    setSelectedCategory(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (category: AdminCategoryItem) => {
    setSelectedCategory(category);
    setIsDrawerOpen(true);
  };

  const handleOpenDeleteDialog = (category: AdminCategoryItem) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      showSuccess('Xóa danh mục thành công');
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (err: unknown) {
      showError(err);
    }
  };

  return (
    <div
      data-testid="admin-category-page"
      className="w-full bg-[#fbfbf5]"
      style={{ fontFeatureSettings: '"ss03"' }}
    >
      <div className="w-full space-y-8">
        {/* Header Action Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-[44px] md:text-[48px] leading-[54px] font-[330] tracking-[-0.02em] text-black">
              Danh mục
            </h1>
            <p className="text-[15px] leading-[22px] text-zinc-500">
              Quản lý và tổ chức các danh mục ngành hàng trên hệ thống.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={handleOpenCreateDrawer}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] bg-black text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm danh mục</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Bento Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-[#e4e4e7] shadow-sm">
            <span className="text-xs text-zinc-500 font-medium">Tổng số danh mục</span>
            {isLoading ? (
              <div data-testid="stats-skeleton-total" className="h-8 w-14 bg-zinc-200 rounded-md animate-pulse mt-1" />
            ) : (
              <div className="text-2xl font-semibold text-black mt-1">{totalCount}</div>
            )}
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#e4e4e7] shadow-sm">
            <span className="text-xs text-zinc-500 font-medium">Đang hoạt động</span>
            {isLoading ? (
              <div data-testid="stats-skeleton-active" className="h-8 w-14 bg-zinc-200 rounded-md animate-pulse mt-1" />
            ) : (
              <div className="text-2xl font-semibold text-black mt-1">{activeCount}</div>
            )}
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#e4e4e7] shadow-sm">
            <span className="text-xs text-zinc-500 font-medium">Đang ẩn</span>
            {isLoading ? (
              <div data-testid="stats-skeleton-hidden" className="h-8 w-14 bg-zinc-200 rounded-md animate-pulse mt-1" />
            ) : (
              <div className="text-2xl font-semibold text-black mt-1">{hiddenCount}</div>
            )}
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#e4e4e7] shadow-sm">
            <span className="text-xs text-zinc-500 font-medium">Sản phẩm liên kết</span>
            {isLoading ? (
              <div data-testid="stats-skeleton-products" className="h-8 w-14 bg-zinc-200 rounded-md animate-pulse mt-1" />
            ) : (
              <div className="text-2xl font-semibold text-black mt-1">{totalProducts}</div>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <label htmlFor="category-search-input" className="sr-only">
              Tìm kiếm danh mục
            </label>
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="category-search-input"
              aria-label="Tìm kiếm danh mục theo tên hoặc slug"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm danh mục theo tên hoặc slug..."
              className="w-full h-11 pl-10 pr-4 bg-white text-black rounded-lg text-sm border border-[#e4e4e7] focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div
            role="group"
            aria-label="Bộ lọc trạng thái danh mục"
            className="flex items-center gap-2 flex-wrap"
            data-testid="status-filter-group"
          >
            <button
              type="button"
              aria-pressed={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
              className={`min-h-[44px] px-4 rounded-full text-xs font-medium inline-flex items-center justify-center transition-colors ${
                statusFilter === 'all'
                  ? 'bg-[#c1fbd4] text-black shadow-sm'
                  : 'bg-white text-zinc-700 border border-[#e4e4e7] hover:bg-zinc-50 hover:text-black'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              aria-pressed={statusFilter === 'active'}
              onClick={() => setStatusFilter('active')}
              className={`min-h-[44px] px-4 rounded-full text-xs font-medium inline-flex items-center justify-center transition-colors ${
                statusFilter === 'active'
                  ? 'bg-[#c1fbd4] text-black shadow-sm'
                  : 'bg-white text-zinc-700 border border-[#e4e4e7] hover:bg-zinc-50 hover:text-black'
              }`}
            >
              Hoạt động
            </button>
            <button
              type="button"
              aria-pressed={statusFilter === 'hidden'}
              onClick={() => setStatusFilter('hidden')}
              className={`min-h-[44px] px-4 rounded-full text-xs font-medium inline-flex items-center justify-center transition-colors ${
                statusFilter === 'hidden'
                  ? 'bg-[#c1fbd4] text-black shadow-sm'
                  : 'bg-white text-zinc-700 border border-[#e4e4e7] hover:bg-zinc-50 hover:text-black'
              }`}
            >
              Đang ẩn
            </button>
          </div>
        </div>

        {/* Error State */}
        {isError && (
          <div
            data-testid="admin-category-error"
            className="p-6 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-800"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div className="text-sm">
                <span className="font-semibold">Đã xảy ra lỗi khi tải danh sách danh mục: </span>
                <span>{(error as Error)?.message || 'Vui lòng thử lại sau.'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full px-5 py-2.5 min-h-[44px] bg-red-100 hover:bg-red-200 text-red-900 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tải lại</span>
            </button>
          </div>
        )}

        {/* Data Table */}
        {!isError && (
          <div className="space-y-4">
            <AdminCategoryListTable
              categories={filteredCategories}
              isLoading={isLoading}
              onEdit={handleOpenEditDrawer}
              onDelete={handleOpenDeleteDialog}
            />

            {/* Pagination & Count */}
            {!isLoading && filteredCategories.length > 0 && (
              <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 px-2">
                <span>
                  Hiển thị {filteredCategories.length} trong {totalCount} danh mục
                </span>
                <div className="inline-flex items-center gap-1">
                  <span
                    aria-label="Trang 1"
                    aria-current="page"
                    className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-black text-white flex items-center justify-center font-medium"
                  >
                    1
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form Drawer (Create / Edit) */}
        <CategoryFormDrawer
          isOpen={isDrawerOpen}
          category={selectedCategory}
          onClose={() => setIsDrawerOpen(false)}
          onSuccess={() => refetch()}
        />

        {/* Delete Warning / Confirm Dialog */}
        <DeleteWarningDialog
          isOpen={isDeleteDialogOpen}
          category={categoryToDelete}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirmDelete={handleConfirmDelete}
          isDeleting={deleteMutation.isPending}
        />
      </div>
    </div>
  );
};

export default AdminCategoryPage;
