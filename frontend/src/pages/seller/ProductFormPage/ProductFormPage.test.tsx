import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import ProductFormPage from './index';
import { categoryService } from '@/services/category.service';

// Mock the service with hoisted mocks
const { mockCreateProduct, mockUpdateProduct, mockGetProductDetail } = vi.hoisted(() => ({
  mockCreateProduct: vi.fn(),
  mockUpdateProduct: vi.fn(),
  mockGetProductDetail: vi.fn(),
}));

vi.mock('./services/product-form.service', () => ({
  PRODUCT_DETAIL_QUERY_KEY: ['products', 'detail'],
  productFormService: {
    getProductDetail: mockGetProductDetail,
    createProduct: mockCreateProduct,
    updateProduct: mockUpdateProduct,
  },
}));

vi.mock('@/services/category.service', () => ({
  categoryService: {
    useCategories: vi.fn(),
  },
}));

const mockCategoryService = categoryService as any;

const mockCategories = [
  { _id: 'cat-1', id: 'cat-1', name: 'Gia dụng', slug: 'gia-dung', imageUrl: null },
  { _id: 'cat-2', id: 'cat-2', name: 'Nến thơm & Tinh dầu', slug: 'nen-thom', imageUrl: null },
];

const mockProductDetail = {
  id: 'prod-123',
  name: 'Nến thơm sáp đậu nành tinh dầu Mộc Miên',
  slug: 'nen-thom-sap-dau-nanh',
  description: 'Nến thơm sáp đậu nành 100% tự nhiên kết hợp tinh dầu Mộc Miên.',
  price: 350000,
  stock: 24,
  images: [
    'https://example.com/img1.jpg',
    'https://example.com/img2.jpg',
  ],
  category: { id: 'cat-1', name: 'Gia dụng' },
  seller: { id: 'seller-1', shopName: 'Mộc Hương Candle' },
  isActive: true,
  isBlocked: false,
  blockReason: null,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
};

const renderFormPage = (route = '/seller/products/new') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/seller/products/new" element={<ProductFormPage />} />
          <Route path="/seller/products/:id/edit" element={<ProductFormPage />} />
          <Route path="/seller/products" element={<div>My Products Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ProductFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCategoryService.useCategories.mockReturnValue({
      data: mockCategories,
      isLoading: false,
    });
  });

  it('renders create product form with empty inputs and counter', async () => {
    renderFormPage('/seller/products/new');

    expect(
      screen.getByRole('heading', { name: 'Thêm sản phẩm mới' })
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nhập tên sản phẩm/i)).toHaveValue('');
    expect(screen.getByText('0/120')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Gia dụng' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Nến thơm & Tinh dầu' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /đăng bán sản phẩm/i })
    ).toBeInTheDocument();
  });

  it('displays inline validation errors when submitting an empty form', async () => {
    renderFormPage('/seller/products/new');

    const submitBtn = screen.getByRole('button', { name: /đăng bán sản phẩm/i });
    const user = userEvent.setup();

    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Tên sản phẩm không được để trống')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Vui lòng chọn danh mục sản phẩm')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Mô tả sản phẩm không được để trống')
      ).toBeInTheDocument();
      expect(screen.getByText('Giá không được để trống')).toBeInTheDocument();
      expect(screen.getByText('Tồn kho không được để trống')).toBeInTheDocument();
    });

    expect(mockCreateProduct).not.toHaveBeenCalled();
  });

  it('prefills product details when in edit mode', async () => {
    mockGetProductDetail.mockResolvedValue(mockProductDetail);

    renderFormPage('/seller/products/prod-123/edit');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Sửa sản phẩm' })
      ).toBeInTheDocument();
    });

    expect(
      screen.getByDisplayValue('Nến thơm sáp đậu nành tinh dầu Mộc Miên')
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('350000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('24')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        'Nến thơm sáp đậu nành 100% tự nhiên kết hợp tinh dầu Mộc Miên.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('2/5 ảnh')).toBeInTheDocument();
  });

  it('renders BlockedProductAlert and disables public visibility switch if product is blocked', async () => {
    mockGetProductDetail.mockResolvedValue({
      ...mockProductDetail,
      isBlocked: true,
      blockReason: 'Nội dung hoặc hình ảnh vi phạm chính sách',
    });

    renderFormPage('/seller/products/prod-123/edit');

    await waitFor(() => {
      expect(screen.getByTestId('blocked-product-alert')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/sản phẩm đang bị admin khóa/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/nội dung hoặc hình ảnh vi phạm chính sách/i)
    ).toBeInTheDocument();

    const switchToggle = screen.getByLabelText('Hiển thị công khai');
    expect(switchToggle).toBeDisabled();
  });

  it('successfully creates product on valid submit', async () => {
    mockCreateProduct.mockResolvedValue({
      ...mockProductDetail,
      id: 'new-id',
    });

    renderFormPage('/seller/products/new');

    const nameInput = screen.getByPlaceholderText(/nhập tên sản phẩm/i);
    const categorySelect = screen.getByLabelText(/danh mục/i);
    const descInput = screen.getByPlaceholderText(/mô tả chi tiết/i);
    const priceInput = screen.getByPlaceholderText('350000');
    const stockInput = screen.getByPlaceholderText('24');

    const user = userEvent.setup();

    await user.type(nameInput, 'Bộ khay mộc');
    await user.selectOptions(categorySelect, 'cat-1');
    await user.type(descInput, 'Bộ khay gỗ sồi tự nhiên đẹp');
    await user.type(priceInput, '180000');
    await user.type(stockInput, '10');

    const submitBtn = screen.getByRole('button', { name: /đăng bán sản phẩm/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateProduct).toHaveBeenCalledWith({
        name: 'Bộ khay mộc',
        categoryId: 'cat-1',
        description: 'Bộ khay gỗ sồi tự nhiên đẹp',
        price: 180000,
        stock: 10,
        images: [],
      });
    });
  });

  it('successfully updates product on valid edit submit', async () => {
    mockGetProductDetail.mockResolvedValue(mockProductDetail);
    mockUpdateProduct.mockResolvedValue({
      ...mockProductDetail,
      price: 390000,
    });

    renderFormPage('/seller/products/prod-123/edit');

    await waitFor(() => {
      expect(screen.getByDisplayValue('350000')).toBeInTheDocument();
    });

    const priceInput = screen.getByDisplayValue('350000');
    const user = userEvent.setup();
    await user.clear(priceInput);
    await user.type(priceInput, '390000');

    const saveBtn = screen.getByRole('button', { name: /lưu thay đổi/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateProduct).toHaveBeenCalledWith(
        'prod-123',
        expect.objectContaining({
          price: 390000,
        })
      );
    });
  });
});
