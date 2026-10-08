import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ProductSummary } from '@/types/product.types';

const { mockUseProducts, mockUseCategories } = vi.hoisted(() => ({
  mockUseProducts: vi.fn(),
  mockUseCategories: vi.fn(),
}));

vi.mock('@/hooks/queries/useProducts', () => ({ useProducts: mockUseProducts }));
vi.mock('@/services/category.service', () => ({ categoryService: { useCategories: mockUseCategories } }));

import Homepage from '../index';

const item = (n: number, over: Partial<ProductSummary> = {}): ProductSummary => ({
  id: `p${n}`,
  name: `Sản phẩm ${n}`,
  slug: null,
  price: 100000 * n,
  stock: 3,
  imageUrl: null,
  sellerId: 's1',
  shopName: 'Shop A',
  ...over,
});

const page = (items: ProductSummary[], over = {}) => ({
  data: { items, total: 30, page: 1, limit: 12, totalPages: 3, ...over },
  isPending: false,
  isError: false,
  isPlaceholderData: false,
  refetch: vi.fn(),
});

const categories = [
  { id: 'c1', _id: 'c1', name: 'Điện thoại', slug: 'dien-thoai', imageUrl: null },
  { id: 'c2', _id: 'c2', name: 'Thời trang', slug: 'thoi-trang', imageUrl: null },
];

const renderAt = (url = '/') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Homepage />
    </MemoryRouter>
  );

const lastParams = () => mockUseProducts.mock.calls[mockUseProducts.mock.calls.length - 1][0];

describe('Homepage (danh sách sản phẩm)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCategories.mockReturnValue({ data: categories, isLoading: false, isError: false, refetch: vi.fn() });
    mockUseProducts.mockReturnValue(page([item(1), item(2)]));
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  });

  it('shows the hero, cards, range text and pagination', () => {
    renderAt();
    expect(screen.getByRole('heading', { level: 1, name: 'Mua sắm từ hàng nghìn gian hàng' })).toBeInTheDocument();
    expect(screen.getAllByTestId('product-card')).toHaveLength(2);
    expect(screen.getByTestId('product-range')).toHaveTextContent('Hiển thị 1-2 / 30 sản phẩm');
    expect(screen.getByRole('button', { name: 'Trang 3' })).toBeInTheDocument();
  });

  it('requests page 1, 12 per page, newest first by default', () => {
    renderAt();
    expect(lastParams()).toMatchObject({ page: 1, limit: 12, sortBy: 'createdAt', order: 'desc' });
    expect(lastParams().categoryId).toBeUndefined();
  });

  it('maps URL filters to API params (slug → categoryId, price, search, sort)', () => {
    renderAt('/?q=iphone&category=thoi-trang&minPrice=100000&maxPrice=5000000&sort=price_asc&page=2');
    expect(lastParams()).toMatchObject({
      page: 2,
      search: 'iphone',
      categoryId: 'c2',
      minPrice: 100000,
      maxPrice: 5000000,
      sortBy: 'price',
      order: 'asc',
    });
    expect(screen.getByTestId('search-keyword')).toHaveTextContent('iphone');
  });

  it('does not query while the category list is needed but still loading', () => {
    mockUseCategories.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() });
    mockUseProducts.mockReturnValue({ ...page([]), data: undefined, isPending: true });
    renderAt('/?category=thoi-trang');
    expect(mockUseProducts.mock.calls.every((c) => c[1] === false)).toBe(true);
    expect(screen.getByTestId('product-grid-loading')).toBeInTheDocument();
  });

  it('treats an unknown category slug as "no results" without calling the API', () => {
    renderAt('/?category=khong-ton-tai');
    expect(mockUseProducts.mock.calls.every((c) => c[1] === false)).toBe(true);
    expect(screen.getByTestId('product-grid-empty')).toHaveTextContent('Không tìm thấy sản phẩm phù hợp');
  });

  it('shows skeletons while loading', () => {
    mockUseProducts.mockReturnValue({ ...page([]), data: undefined, isPending: true });
    renderAt();
    expect(screen.getByTestId('product-grid-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('product-range')).not.toBeInTheDocument();
  });

  it('shows a retryable error state', () => {
    const refetch = vi.fn();
    mockUseProducts.mockReturnValue({ ...page([]), data: undefined, isError: true, refetch });
    renderAt();
    fireEvent.click(within(screen.getByTestId('product-grid-error')).getByRole('button', { name: 'Thử lại' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('empty catalog (no filters) shows the plain empty message without a clear button', () => {
    mockUseProducts.mockReturnValue(page([], { total: 0, totalPages: 0 }));
    renderAt();
    expect(screen.getByTestId('product-grid-empty')).toHaveTextContent('Chưa có sản phẩm nào');
    expect(screen.queryByRole('button', { name: 'Xóa bộ lọc' })).not.toBeInTheDocument();
  });

  it('no match with filters offers to clear them', () => {
    mockUseProducts.mockReturnValue(page([], { total: 0, totalPages: 0 }));
    renderAt('/?q=zzz');
    fireEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }));
    expect(lastParams().search).toBeUndefined();
  });

  it('changing the sort goes back to page 1', () => {
    renderAt('/?page=3');
    fireEvent.change(screen.getByLabelText('Sắp xếp sản phẩm'), { target: { value: 'price_desc' } });
    expect(lastParams()).toMatchObject({ page: 1, sortBy: 'price', order: 'desc' });
  });

  it('paging asks the API for that page and scrolls to the top', () => {
    renderAt();
    fireEvent.click(screen.getByRole('button', { name: 'Trang 2' }));
    expect(lastParams().page).toBe(2);
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('applies the price range from the sidebar only after pressing "Áp dụng"', () => {
    renderAt();
    const sidebar = screen.getByTestId('product-filter-sidebar');
    fireEvent.change(within(sidebar).getByLabelText('Giá từ'), { target: { value: '100.000' } });
    expect(lastParams().minPrice).toBeUndefined();

    fireEvent.click(within(sidebar).getByRole('button', { name: 'Áp dụng' }));
    expect(lastParams().minPrice).toBe(100000);
  });

  it('rejects an inverted price range', () => {
    renderAt();
    const sidebar = screen.getByTestId('product-filter-sidebar');
    fireEvent.change(within(sidebar).getByLabelText('Giá từ'), { target: { value: '900000' } });
    fireEvent.change(within(sidebar).getByLabelText('Giá đến'), { target: { value: '100000' } });
    fireEvent.click(within(sidebar).getByRole('button', { name: 'Áp dụng' }));
    expect(within(sidebar).getByRole('alert')).toBeInTheDocument();
    expect(lastParams().minPrice).toBeUndefined();
  });

  it('selecting a category applies immediately and "Thiết lập lại" clears it', () => {
    renderAt();
    const sidebar = screen.getByTestId('product-filter-sidebar');
    fireEvent.click(within(sidebar).getByRole('radio', { name: /Điện thoại/ }));
    expect(lastParams().categoryId).toBe('c1');

    fireEvent.click(within(sidebar).getByRole('button', { name: 'Thiết lập lại' }));
    expect(lastParams().categoryId).toBeUndefined();
  });

  it('sold-out products are still listed with a badge', () => {
    mockUseProducts.mockReturnValue(page([item(1, { stock: 0 })]));
    renderAt();
    expect(screen.getByText('Hết hàng')).toBeInTheDocument();
  });
});
