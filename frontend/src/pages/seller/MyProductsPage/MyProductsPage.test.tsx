import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import MyProductsPage from './index';
import { userService } from '@/services/user.service';
import { categoryService } from '@/services/category.service';
import { myProductsService } from './services/my-products.service';

vi.mock('@/services/user.service', () => ({
  userService: {
    useGetProfile: vi.fn(),
  },
}));

vi.mock('@/services/category.service', () => ({
  categoryService: {
    useCategories: vi.fn(),
  },
}));

vi.mock('./services/my-products.service', () => {
  const mockService = {
    getMyProducts: vi.fn(),
    toggleActive: vi.fn(),
    deleteProduct: vi.fn(),
  };
  return {
    MY_PRODUCTS_QUERY_KEY: ['seller', 'products', 'mine'],
    myProductsService: mockService,
  };
});

const mockUserService = userService as any;
const mockCategoryService = categoryService as any;
const mockProductsService = myProductsService as any;

const mockProducts = [
  {
    id: 'prod-1',
    name: 'Nến thơm sáp đậu nành tinh dầu Mộc Miên',
    slug: 'nen-thom-sap-dau-nanh',
    price: 350000,
    stock: 24,
    images: ['https://example.com/img1.jpg'],
    categoryId: 'cat-1',
    sellerId: 'seller-1',
    isActive: true,
    description: 'Nến thơm cao cấp',
    isBlocked: false,
    blockReason: null,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 'prod-2',
    name: 'Khay đựng nến gỗ sồi tự nhiên',
    slug: 'khay-dung-nen-go-soi',
    price: 280000,
    stock: 8,
    images: ['https://example.com/img2.jpg'],
    categoryId: 'cat-1',
    sellerId: 'seller-1',
    isActive: false,
    description: 'Khay gỗ sồi mộc',
    isBlocked: false,
    blockReason: null,
    createdAt: '2026-10-02T00:00:00Z',
    updatedAt: '2026-10-02T00:00:00Z',
  },
  {
    id: 'prod-3',
    name: 'Bình gốm thủ công men rạn Mộc Vân',
    slug: 'binh-gom-thu-cong-men-ran',
    price: 850000,
    stock: 5,
    images: ['https://example.com/img3.jpg'],
    categoryId: 'cat-2',
    sellerId: 'seller-1',
    isActive: true,
    description: 'Bình gốm men rạn',
    isBlocked: true,
    blockReason: 'Hình ảnh không phù hợp',
    createdAt: '2026-10-03T00:00:00Z',
    updatedAt: '2026-10-03T00:00:00Z',
  },
];

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/seller/products']}>
        <MyProductsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('MyProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCategoryService.useCategories.mockReturnValue({
      data: [
        { _id: 'cat-1', name: 'Gia dụng', slug: 'gia-dung' },
        { _id: 'cat-2', name: 'Thủ công', slug: 'thu-cong' },
      ],
      isLoading: false,
    });
  });

  it('renders ShopNotSetupBanner when user has not set up a shop', async () => {
    mockUserService.useGetProfile.mockReturnValue({
      data: { id: 'seller-1', fullName: 'Nguyen Van A', shop: null },
      isLoading: false,
    });
    mockProductsService.getMyProducts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    renderPage();

    expect(screen.getByTestId('shop-not-setup-banner')).toBeInTheDocument();
    expect(screen.getByText(/chưa thiết lập gian hàng/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /thiết lập ngay/i })).toHaveAttribute(
      'href',
      '/seller/setup'
    );
  });

  it('renders EmptyProductsState when seller has a shop but no products', async () => {
    mockUserService.useGetProfile.mockReturnValue({
      data: {
        id: 'seller-1',
        fullName: 'Nguyen Van A',
        shop: { shopName: 'Mộc Hương Candle' },
      },
      isLoading: false,
    });
    mockProductsService.getMyProducts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('empty-products-state')).toBeInTheDocument();
    });
    expect(screen.getByText(/chưa có sản phẩm nào/i)).toBeInTheDocument();
  });

  it('renders product table with products, status badges and prices', async () => {
    mockUserService.useGetProfile.mockReturnValue({
      data: {
        id: 'seller-1',
        fullName: 'Nguyen Van A',
        shop: { shopName: 'Mộc Hương Candle' },
      },
      isLoading: false,
    });
    mockProductsService.getMyProducts.mockResolvedValue({
      items: mockProducts,
      total: 3,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText('Nến thơm sáp đậu nành tinh dầu Mộc Miên')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('350.000₫')).toBeInTheDocument();
    expect(screen.getByText('280.000₫')).toBeInTheDocument();
    expect(screen.getByText('850.000₫')).toBeInTheDocument();

    // Badges
    expect(screen.getAllByText('Đang bán').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Đã ẩn').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Bị khóa').length).toBeGreaterThanOrEqual(1);

    // Block reason
    expect(screen.getByTestId('block-reason-text')).toHaveTextContent(
      'Hình ảnh không phù hợp'
    );
  });

  it('filters products by search input', async () => {
    mockUserService.useGetProfile.mockReturnValue({
      data: {
        id: 'seller-1',
        fullName: 'Nguyen Van A',
        shop: { shopName: 'Mộc Hương Candle' },
      },
      isLoading: false,
    });
    mockProductsService.getMyProducts.mockResolvedValue({
      items: mockProducts,
      total: 3,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText('Nến thơm sáp đậu nành tinh dầu Mộc Miên')
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Tìm theo tên sản phẩm');
    fireEvent.change(searchInput, { target: { value: 'Khay' } });

    expect(
      screen.getByText('Khay đựng nến gỗ sồi tự nhiên')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Nến thơm sáp đậu nành tinh dầu Mộc Miên')
    ).not.toBeInTheDocument();
  });

  it('filters products by status filter chips', async () => {
    mockUserService.useGetProfile.mockReturnValue({
      data: {
        id: 'seller-1',
        fullName: 'Nguyen Van A',
        shop: { shopName: 'Mộc Hương Candle' },
      },
      isLoading: false,
    });
    mockProductsService.getMyProducts.mockResolvedValue({
      items: mockProducts,
      total: 3,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText('Nến thơm sáp đậu nành tinh dầu Mộc Miên')
      ).toBeInTheDocument();
    });

    // Click "Bị khóa" filter chip
    const lockedChip = screen.getByRole('button', { name: /^Bị khóa/i });
    fireEvent.click(lockedChip);

    expect(
      screen.getByText('Bình gốm thủ công men rạn Mộc Vân')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Nến thơm sáp đậu nành tinh dầu Mộc Miên')
    ).not.toBeInTheDocument();
  });

  it('disables toggle button on blocked product with explanation', async () => {
    mockUserService.useGetProfile.mockReturnValue({
      data: {
        id: 'seller-1',
        fullName: 'Nguyen Van A',
        shop: { shopName: 'Mộc Hương Candle' },
      },
      isLoading: false,
    });
    mockProductsService.getMyProducts.mockResolvedValue({
      items: mockProducts,
      total: 3,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText('Bình gốm thủ công men rạn Mộc Vân')
      ).toBeInTheDocument();
    });

    const blockedBtn = screen.getByLabelText('Sản phẩm bị khóa');
    expect(blockedBtn).toBeDisabled();
    expect(blockedBtn).toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.getByText(/sản phẩm bị admin khóa, bạn không thể tự mở lại/i)
    ).toBeInTheDocument();
  });

  it('calls toggle mutation when toggle button is clicked on an unblocked product', async () => {
    mockUserService.useGetProfile.mockReturnValue({
      data: {
        id: 'seller-1',
        fullName: 'Nguyen Van A',
        shop: { shopName: 'Mộc Hương Candle' },
      },
      isLoading: false,
    });
    mockProductsService.getMyProducts.mockResolvedValue({
      items: mockProducts,
      total: 3,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    mockProductsService.toggleActive.mockResolvedValue({
      ...mockProducts[0],
      isActive: false,
    });

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText('Nến thơm sáp đậu nành tinh dầu Mộc Miên')
      ).toBeInTheDocument();
    });

    const toggleBtn = screen.getByLabelText(
      'Trạng thái hiển thị Nến thơm sáp đậu nành tinh dầu Mộc Miên'
    );
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(mockProductsService.toggleActive).toHaveBeenCalledWith('prod-1', false);
    });
  });

  it('opens delete dialog and confirms soft delete', async () => {
    mockUserService.useGetProfile.mockReturnValue({
      data: {
        id: 'seller-1',
        fullName: 'Nguyen Van A',
        shop: { shopName: 'Mộc Hương Candle' },
      },
      isLoading: false,
    });
    mockProductsService.getMyProducts.mockResolvedValue({
      items: mockProducts,
      total: 3,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    mockProductsService.deleteProduct.mockResolvedValue({
      id: 'prod-1',
      isActive: false,
    });

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText('Nến thơm sáp đậu nành tinh dầu Mộc Miên')
      ).toBeInTheDocument();
    });

    // Click delete icon on first row
    const deleteButtons = screen.getAllByTitle('Ẩn sản phẩm');
    fireEvent.click(deleteButtons[0]);

    // Dialog opens
    expect(screen.getByTestId('delete-product-dialog')).toBeInTheDocument();
    expect(screen.getByText(/xác nhận ẩn sản phẩm/i)).toBeInTheDocument();

    // Confirm button
    const confirmBtn = screen.getByRole('button', { name: /ẩn sản phẩm/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockProductsService.deleteProduct).toHaveBeenCalledWith('prod-1');
    });
  });
});
