import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ProductDetail } from '@/types/product.types';
import { useAuthStore } from '@/stores/auth.store';

const { mockDetail, mockProducts, mockShop, mockMutate, mockToastInfo, mockAddToCart } = vi.hoisted(() => ({
  mockDetail: vi.fn(),
  mockProducts: vi.fn(),
  mockShop: vi.fn(),
  mockMutate: vi.fn(),
  mockToastInfo: vi.fn(),
  mockAddToCart: vi.fn(),
}));

vi.mock('@/hooks/queries/useProducts', () => ({
  useProductDetail: mockDetail,
  useProducts: mockProducts,
  useSetProductActive: () => ({ mutate: mockMutate, isPending: false }),
}));
vi.mock('@/hooks/queries/useCart', () => ({
  useAddToCart: () => ({ mutate: mockAddToCart, isPending: false }),
}));
vi.mock('@/hooks/queries/usePublicShop', () => ({ usePublicShop: mockShop }));
vi.mock('react-toastify', () => ({ toast: { info: mockToastInfo, success: vi.fn(), error: vi.fn() } }));

import ProductDetailPage from '../index';

const product: ProductDetail = {
  id: 'p1',
  name: 'Điện thoại Minimal Phone One',
  slug: 'minimal-phone-k3f9',
  description: 'Dòng 1\nDòng 2 <script>alert(1)</script>',
  price: 12890000,
  stock: 24,
  images: ['https://res.cloudinary.com/demo/1.jpg', 'https://res.cloudinary.com/demo/2.jpg'],
  category: { id: 'c1', name: 'Điện thoại', slug: 'dien-thoai' },
  seller: { id: 's1', shopName: 'Lam Phong Tech' },
  isActive: true,
  isBlocked: false,
  blockReason: null,
};

const ok = (data: ProductDetail) => ({ data, isPending: false, isError: false, error: null, refetch: vi.fn() });

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/products/p1']}>
      <Routes>
        <Route path="/products/:id" element={<ProductDetailPage />} />
      </Routes>
    </MemoryRouter>
  );

const asGuest = () => useAuthStore.setState({ status: 'guest', user: null, accessToken: null });
const asUser = (id: string, role: 'customer' | 'admin' = 'customer') =>
  useAuthStore.setState({
    status: 'authed',
    user: { id, email: 'u@x.vn', fullName: 'U', role },
    accessToken: 't',
  });

describe('ProductDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShop.mockReturnValue({ data: { shopName: 'Lam Phong Tech', joinedAt: '2026-03-12T00:00:00.000Z', productCount: 42 } });
    mockProducts.mockReturnValue({
      isPending: false,
      data: {
        items: [
          { id: 'p1', name: 'Chính nó', price: 1, stock: 1, imageUrl: null, slug: null, sellerId: 's1', shopName: 'Lam Phong Tech' },
          { id: 'p2', name: 'Bao da thủ công', price: 850000, stock: 3, imageUrl: null, slug: null, sellerId: 's1', shopName: 'Lam Phong Tech' },
        ],
      },
    });
    asGuest();
  });

  it('waits (skeleton) while the product is loading', () => {
    mockDetail.mockReturnValue({ data: undefined, isPending: true, isError: false, error: null, refetch: vi.fn() });
    renderPage();
    expect(screen.getByTestId('product-detail-skeleton')).toBeInTheDocument();
  });

  it('shows the not-found state on 404', () => {
    mockDetail.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: { response: { status: 404 } },
      refetch: vi.fn(),
    });
    renderPage();
    expect(screen.getByTestId('product-not-found')).toBeInTheDocument();
  });

  it('shows a retryable error for other failures', () => {
    const refetch = vi.fn();
    mockDetail.mockReturnValue({ data: undefined, isPending: false, isError: true, error: { response: { status: 500 } }, refetch });
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('guest: shows product info, shop meta, login hint and cart button', () => {
    mockDetail.mockReturnValue(ok(product));
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: product.name })).toBeInTheDocument();
    expect(screen.getByTestId('product-price')).toHaveTextContent(/12\.890\.000/);
    expect(screen.getByTestId('product-stock')).toHaveTextContent('Còn 24 sản phẩm trong kho');
    expect(screen.getByTestId('product-shop-card')).toHaveTextContent('Tham gia từ 03/2026');
    expect(screen.getByTestId('product-shop-card')).toHaveTextContent('42 sản phẩm');
    expect(screen.getByText('Đăng nhập để thêm sản phẩm vào giỏ hàng')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thêm vào giỏ/ })).toBeEnabled();
    expect(screen.queryByTestId('banner-owner')).not.toBeInTheDocument();
  });

  it('renders the description as plain text (no HTML injection)', () => {
    mockDetail.mockReturnValue(ok(product));
    const { container } = renderPage();
    expect(screen.getByTestId('product-description')).toHaveTextContent('<script>alert(1)</script>');
    expect(container.querySelector('script')).toBeNull();
  });

  it('keeps the quantity within 1..stock', () => {
    mockDetail.mockReturnValue(ok({ ...product, stock: 2 }));
    renderPage();

    const plus = screen.getByRole('button', { name: 'Tăng số lượng' });
    const minus = screen.getByRole('button', { name: 'Giảm số lượng' });
    expect(minus).toBeDisabled();

    fireEvent.click(plus);
    expect(screen.getByTestId('qty-value')).toHaveTextContent('2');
    expect(plus).toBeDisabled();

    fireEvent.click(minus);
    expect(screen.getByTestId('qty-value')).toHaveTextContent('1');
  });

  it('add to cart sends the product id, chosen quantity and current stock', () => {
    mockDetail.mockReturnValue(ok(product));
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Tăng số lượng' }));
    fireEvent.click(screen.getByRole('button', { name: /Thêm vào giỏ/ }));
    expect(mockAddToCart).toHaveBeenCalledWith(
      { productId: 'p1', quantity: 2, stock: 24 },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  it('out of stock: disables purchase buttons and explains why', () => {
    mockDetail.mockReturnValue(ok({ ...product, stock: 0 }));
    renderPage();

    expect(screen.getByTestId('panel-soldout')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thêm vào giỏ/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Mua ngay' })).toBeDisabled();
    expect(screen.getByText(/tạm hết hàng\. Vui lòng quay lại sau/)).toBeInTheDocument();
    expect(screen.getByTestId('product-stock')).toHaveTextContent('Tạm thời hết hàng');
  });

  it('a signed-in buyer (not the owner) can buy and sees no login hint', () => {
    asUser('someone-else');
    mockDetail.mockReturnValue(ok(product));
    renderPage();
    expect(screen.getByRole('button', { name: /Thêm vào giỏ/ })).toBeEnabled();
    expect(screen.queryByText('Đăng nhập để thêm sản phẩm vào giỏ hàng')).not.toBeInTheDocument();
  });

  it('owner: sees management tools instead of purchase buttons and can hide the product', () => {
    asUser('s1');
    mockDetail.mockReturnValue(ok(product));
    renderPage();

    expect(screen.getByTestId('banner-owner')).toBeInTheDocument();
    expect(screen.getByTestId('panel-owner')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Thêm vào giỏ/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Chỉnh sửa sản phẩm/ })).toHaveAttribute('href', '/seller/products/p1/edit');

    fireEvent.click(screen.getByRole('button', { name: /Ẩn sản phẩm/ }));
    expect(mockMutate.mock.calls[0][0]).toEqual({ id: 'p1', isActive: false });
  });

  it('owner of a hidden product can show it again', () => {
    asUser('s1');
    mockDetail.mockReturnValue(ok({ ...product, isActive: false }));
    renderPage();

    expect(screen.getByTestId('banner-hidden')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Hiện sản phẩm/ }));
    expect(mockMutate.mock.calls[0][0]).toEqual({ id: 'p1', isActive: true });
  });

  it('owner of a blocked product: shows the reason, only editing is allowed', () => {
    asUser('s1');
    mockDetail.mockReturnValue(ok({ ...product, isBlocked: true, blockReason: 'Hình ảnh không phù hợp' }));
    renderPage();

    expect(screen.getByTestId('banner-blocked')).toHaveTextContent('Lý do: Hình ảnh không phù hợp');
    expect(screen.getByRole('link', { name: /Chỉnh sửa sản phẩm/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ẩn sản phẩm/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Bị khóa bởi Quản trị viên/)).toBeInTheDocument();
  });

  it('admin: sees the moderation note and cannot buy', () => {
    asUser('admin-1', 'admin');
    mockDetail.mockReturnValue(ok(product));
    renderPage();

    expect(screen.getByTestId('panel-admin')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Thêm vào giỏ/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Chỉnh sửa sản phẩm/ })).not.toBeInTheDocument();
  });

  it('does not call the API while the session is still booting', () => {
    useAuthStore.setState({ status: 'booting', user: null, accessToken: null });
    mockDetail.mockReturnValue({ data: undefined, isPending: true, isError: false, error: null, refetch: vi.fn() });
    renderPage();
    expect(mockDetail).toHaveBeenCalledWith('p1', 'guest', false);
  });

  it('lists other products of the shop without the current one', () => {
    mockDetail.mockReturnValue(ok(product));
    renderPage();
    const related = screen.getByTestId('related-products');
    expect(related).toHaveTextContent('Bao da thủ công');
    expect(related).not.toHaveTextContent('Chính nó');
    expect(related).toHaveTextContent('Xem tất cả 42 sản phẩm');
  });
});
