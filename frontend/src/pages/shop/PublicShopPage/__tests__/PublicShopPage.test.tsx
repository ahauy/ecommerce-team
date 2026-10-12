import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ProductSummary } from '@/types/product.types';
import type { PublicShopResponseDto } from '@/types/shop.types';

const { mockUsePublicShop, mockUseProducts, mockUseCategories } = vi.hoisted(() => ({
  mockUsePublicShop: vi.fn(),
  mockUseProducts: vi.fn(),
  mockUseCategories: vi.fn(),
}));

vi.mock('@/hooks/queries/usePublicShop', () => ({
  usePublicShop: mockUsePublicShop,
  default: mockUsePublicShop,
}));
vi.mock('@/hooks/queries/useProducts', () => ({
  useProducts: mockUseProducts,
  default: mockUseProducts,
}));
vi.mock('@/services/category.service', () => ({
  categoryService: { useCategories: mockUseCategories },
}));

import PublicShopPage from '../PublicShopPage';

const mockShop: PublicShopResponseDto = {
  sellerId: 'seller-1',
  shopName: 'Mộc Hương Candle',
  shopSlug: 'moc-huong-candle',
  joinedAt: '2026-03-15T08:00:00.000Z',
  productCount: 42,
};

const makeProduct = (n: number, over: Partial<ProductSummary> = {}): ProductSummary => ({
  id: `p${n}`,
  name: `Nến thơm Mộc Miên ${n}`,
  slug: `nen-thom-${n}`,
  price: 350000 * n,
  stock: 5,
  imageUrl: `https://res.cloudinary.com/demo/p${n}.jpg`,
  sellerId: 'seller-1',
  shopName: 'Mộc Hương Candle',
  ...over,
});

const makeProductsPage = (items: ProductSummary[], over = {}) => ({
  data: { items, total: 32, page: 1, limit: 16, totalPages: 2, ...over },
  isPending: false,
  isError: false,
  isPlaceholderData: false,
  refetch: vi.fn(),
});

const categories = [
  { id: 'c1', _id: 'c1', name: 'Điện thoại', slug: 'dien-thoai', imageUrl: null },
  { id: 'c2', _id: 'c2', name: 'Thời trang', slug: 'thoi-trang', imageUrl: null },
];

const renderShopPage = (url = '/shops/seller-1') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/shops/:sellerId" element={<PublicShopPage />} />
      </Routes>
    </MemoryRouter>
  );

const lastProductsCall = () => {
  const calls = mockUseProducts.mock.calls;
  return calls[calls.length - 1];
};

describe('PublicShopPage (/shops/:sellerId)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePublicShop.mockReturnValue({
      data: mockShop,
      isPending: false,
      isError: false,
    });
    mockUseCategories.mockReturnValue({
      data: categories,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mockUseProducts.mockReturnValue(makeProductsPage([makeProduct(1), makeProduct(2)]));
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  });

  it('shows shop loading indicator while shop info is pending', () => {
    mockUsePublicShop.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    });
    renderShopPage();
    expect(screen.getByText('Đang tải thông tin gian hàng...')).toBeInTheDocument();
  });

  it('shows 404/error state when shop is not found or usePublicShop errors', () => {
    mockUsePublicShop.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
    });
    renderShopPage();
    expect(screen.getByTestId('public-shop-not-found')).toBeInTheDocument();
    expect(screen.getByText('Không tìm thấy gian hàng')).toBeInTheDocument();
  });

  it('renders shop header info (shopName, @shopSlug, joinedAt, productCount) and hides @shopSlug when empty', () => {
    const { unmount } = renderShopPage();
    expect(screen.getByTestId('public-shop-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Mộc Hương Candle' })).toBeInTheDocument();
    expect(screen.getByText('@moc-huong-candle')).toBeInTheDocument();
    expect(screen.getByText(/Tham gia từ 15\/03\/2026/)).toBeInTheDocument();
    expect(screen.getByText('42 sản phẩm')).toBeInTheDocument();
    unmount();

    mockUsePublicShop.mockReturnValue({
      data: { ...mockShop, shopSlug: '' },
      isPending: false,
      isError: false,
    });
    renderShopPage();
    expect(screen.queryByText(/^@/)).not.toBeInTheDocument();
  });

  it('queries products with sellerId, limit 16, newest sort by default, and renders cards without shopName', () => {
    renderShopPage();
    const [params, enabled] = lastProductsCall();
    expect(enabled).toBe(true);
    expect(params).toMatchObject({
      sellerId: 'seller-1',
      page: 1,
      limit: 16,
      sortBy: 'createdAt',
      order: 'desc',
    });
    expect(params.categoryId).toBeUndefined();

    const grid = screen.getByTestId('shop-product-grid');
    expect(within(grid).getAllByTestId('product-card')).toHaveLength(2);
    expect(within(grid).getByText('Nến thơm Mộc Miên 1')).toBeInTheDocument();
    // Shop name should not be repeated inside product cards on PublicShopPage
    expect(within(grid).queryByText('Mộc Hương Candle')).not.toBeInTheDocument();
  });

  it('syncs category, sort, and page from URL query params and resets page to 1 when changing category or sort', () => {
    renderShopPage('/shops/seller-1?category=thoi-trang&sort=price_asc&page=2');
    expect(lastProductsCall()[0]).toMatchObject({
      sellerId: 'seller-1',
      page: 2,
      limit: 16,
      categoryId: 'c2',
      sortBy: 'price',
      order: 'asc',
    });

    // Changing category pill resets page to 1
    fireEvent.click(screen.getByRole('button', { name: 'Điện thoại' }));
    expect(lastProductsCall()[0]).toMatchObject({
      sellerId: 'seller-1',
      page: 1,
      categoryId: 'c1',
      sortBy: 'price',
      order: 'asc',
    });

    // Navigate to page 2 then change sort -> resets page to 1
    fireEvent.click(screen.getByRole('button', { name: 'Trang 2' }));
    expect(lastProductsCall()[0].page).toBe(2);

    fireEvent.change(screen.getByLabelText('Sắp xếp sản phẩm'), {
      target: { value: 'price_desc' },
    });
    expect(lastProductsCall()[0]).toMatchObject({
      page: 1,
      sortBy: 'price',
      order: 'desc',
    });

    fireEvent.change(screen.getByLabelText('Sắp xếp sản phẩm'), {
      target: { value: 'name_asc' },
    });
    expect(lastProductsCall()[0]).toMatchObject({
      page: 1,
      sortBy: 'name',
      order: 'asc',
    });
  });

  it('shows empty shop state when shop.productCount === 0 and does not enable product fetching', () => {
    mockUsePublicShop.mockReturnValue({
      data: { ...mockShop, productCount: 0 },
      isPending: false,
      isError: false,
    });
    renderShopPage();
    const emptyState = screen.getByTestId('shop-products-empty');
    expect(emptyState).toHaveTextContent('Gian hàng chưa có sản phẩm nào');
    expect(screen.queryByTestId('category-nav')).not.toBeInTheDocument();
    expect(mockUseProducts.mock.calls.every((call) => call[1] === false)).toBe(true);
  });

  it('shows empty filtered state with "Xem tất cả sản phẩm" pill CTA that clears category filter', () => {
    mockUseProducts.mockReturnValue(makeProductsPage([], { total: 0, totalPages: 0 }));
    renderShopPage('/shops/seller-1?category=dien-thoai');

    const emptyState = screen.getByTestId('shop-products-empty');
    expect(emptyState).toHaveTextContent('Không tìm thấy sản phẩm phù hợp');

    const clearBtn = within(emptyState).getByRole('button', { name: 'Xem tất cả sản phẩm' });
    fireEvent.click(clearBtn);

    expect(lastProductsCall()[0].categoryId).toBeUndefined();
  });

  it('shows product loading skeleton while products are pending', () => {
    mockUseProducts.mockReturnValue({
      ...makeProductsPage([]),
      data: undefined,
      isPending: true,
    });
    renderShopPage();
    const loadingGrid = screen.getByTestId('shop-products-loading');
    expect(loadingGrid).toBeInTheDocument();
    expect(within(loadingGrid).getAllByTestId('product-card-skeleton').length).toBeGreaterThan(0);
  });

  it('shows product error state and retries when clicking "Thử lại"', () => {
    const refetch = vi.fn();
    mockUseProducts.mockReturnValue({
      ...makeProductsPage([]),
      data: undefined,
      isError: true,
      refetch,
    });
    renderShopPage();
    const errorState = screen.getByTestId('shop-products-error');
    expect(errorState).toBeInTheDocument();

    fireEvent.click(within(errorState).getByRole('button', { name: 'Thử lại' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('handles pagination interaction and scrolls to top', () => {
    renderShopPage();
    fireEvent.click(screen.getByRole('button', { name: 'Trang 2' }));
    expect(lastProductsCall()[0].page).toBe(2);
    expect(window.scrollTo).toHaveBeenCalled();
  });
});
