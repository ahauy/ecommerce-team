import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw, Search } from 'lucide-react';
import Pagination from '@/components/Pagination';
import { showError, showSuccess } from '@/helpers/toast';
import AdminProductTable from './components/AdminProductTable';
import BlockProductDialog from './dialogs/BlockProductDialog';
import UnblockProductDialog from './dialogs/UnblockProductDialog';
import { adminProductService } from './services/admin-product.service';
import type { AdminProduct, AdminProductsParams } from './types';

export const ADMIN_PRODUCTS_PAGE_SIZE = 20;
export const SEARCH_DEBOUNCE_MS = 400;

type BlockFilter = 'all' | 'blocked' | 'unblocked';

const BLOCK_OPTIONS: { value: BlockFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'blocked', label: 'Đang bị chặn' },
  { value: 'unblocked', label: 'Không bị chặn' },
];

const chipClass = (selected: boolean) =>
  `min-h-[44px] px-4 rounded-full text-xs font-medium inline-flex items-center justify-center transition-colors ${
    selected
      ? 'bg-aloe text-black shadow-sm'
      : 'bg-white text-zinc-700 border border-hairline-light hover:bg-zinc-50 hover:text-black'
  }`;

export interface AdminProductPageProps {
  title?: string;
}

export const AdminProductPage: React.FC<AdminProductPageProps> = ({ title = 'Kiểm duyệt sản phẩm' }) => {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [blockFilter, setBlockFilter] = useState<BlockFilter>('all');
  const [page, setPage] = useState(1);
  const [toBlock, setToBlock] = useState<AdminProduct | null>(null);
  const [toUnblock, setToUnblock] = useState<AdminProduct | null>(null);

  useEffect(() => {
    const next = searchInput.trim();
    if (next === search) return;
    const timer = setTimeout(() => {
      setSearch(next);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  const params = useMemo<AdminProductsParams>(
    () => ({
      page,
      limit: ADMIN_PRODUCTS_PAGE_SIZE,
      ...(blockFilter !== 'all' && { isBlocked: blockFilter === 'blocked' }),
      ...(search && { search }),
    }),
    [page, blockFilter, search]
  );

  const { data, isLoading, isError, error, refetch } = adminProductService.useAdminProducts(params);
  const blockMutation = adminProductService.useBlockProduct();
  const unblockMutation = adminProductService.useUnblockProduct();

  const products = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const hasFilters = blockFilter !== 'all' || search !== '';
  const firstIndex = total === 0 ? 0 : (page - 1) * ADMIN_PRODUCTS_PAGE_SIZE + 1;
  const lastIndex = Math.min(page * ADMIN_PRODUCTS_PAGE_SIZE, total);

  const changeBlockFilter = (value: BlockFilter) => {
    setBlockFilter(value);
    setPage(1);
  };

  const handleBlock = async (product: AdminProduct, reason: string) => {
    try {
      await blockMutation.mutateAsync({ id: product.id, reason });
      showSuccess(`Đã chặn sản phẩm "${product.name}"`);
      setToBlock(null);
    } catch (err: unknown) {
      showError(err);
    }
  };

  const handleUnblock = async (product: AdminProduct) => {
    try {
      await unblockMutation.mutateAsync(product.id);
      showSuccess(`Đã mở chặn sản phẩm "${product.name}"`);
      setToUnblock(null);
    } catch (err: unknown) {
      showError(err);
    }
  };

  return (
    <div data-testid="admin-product-page" className="w-full bg-canvas-cream" style={{ fontFeatureSettings: '"ss03"' }}>
      <div className="w-full space-y-8">
        <div className="space-y-1">
          <h1 className="text-[44px] md:text-[48px] leading-[54px] font-[330] tracking-[-0.02em] text-black">
            {title}
          </h1>
          <p className="text-[15px] leading-[22px] text-zinc-500">
            Xem mọi sản phẩm trên sàn, kể cả sản phẩm bị ẩn; chặn sản phẩm vi phạm và mở lại khi cần.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <label htmlFor="product-search-input" className="sr-only">
              Tìm kiếm sản phẩm
            </label>
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              id="product-search-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên sản phẩm..."
              className="w-full h-11 pl-10 pr-4 bg-white text-black rounded-lg text-sm border border-hairline-light focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div role="group" aria-label="Lọc theo trạng thái chặn" className="flex items-center gap-2 flex-wrap">
            {BLOCK_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={blockFilter === option.value}
                onClick={() => changeBlockFilter(option.value)}
                className={chipClass(blockFilter === option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {isError ? (
          <div
            data-testid="admin-product-error"
            className="p-6 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-4 text-red-800"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div className="text-sm">
                <span className="font-semibold">Không tải được danh sách sản phẩm: </span>
                <span>{(error as Error | null)?.message || 'Vui lòng thử lại sau.'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-full px-5 py-2.5 min-h-[44px] bg-red-100 hover:bg-red-200 text-red-900 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tải lại</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <AdminProductTable
              products={products}
              isLoading={isLoading}
              hasFilters={hasFilters}
              onBlock={setToBlock}
              onUnblock={setToUnblock}
            />

            {!isLoading && total > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 pt-2 px-2">
                <span data-testid="product-range">
                  Hiển thị {firstIndex}–{lastIndex} trong {total} sản phẩm
                </span>
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </div>
        )}

        <BlockProductDialog
          isOpen={toBlock !== null}
          product={toBlock}
          onClose={() => setToBlock(null)}
          onConfirm={handleBlock}
          isSubmitting={blockMutation.isPending}
        />

        <UnblockProductDialog
          isOpen={toUnblock !== null}
          product={toUnblock}
          onClose={() => setToUnblock(null)}
          onConfirm={handleUnblock}
          isSubmitting={unblockMutation.isPending}
        />
      </div>
    </div>
  );
};

export default AdminProductPage;
