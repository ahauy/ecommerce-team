import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Cart } from '@/types/cart.types';

const { mockUseCart, mockUpdate, mockRemove, mockToastInfo } = vi.hoisted(() => ({
  mockUseCart: vi.fn(),
  mockUpdate: vi.fn(),
  mockRemove: vi.fn(),
  mockToastInfo: vi.fn(),
}));

vi.mock('@/hooks/queries/useCart', () => ({
  useCart: mockUseCart,
  useUpdateCartItem: () => ({ mutate: mockUpdate, isPending: false, variables: undefined }),
  useRemoveCartItem: () => ({ mutate: mockRemove, isPending: false, variables: undefined }),
}));
vi.mock('react-toastify', () => ({ toast: { info: mockToastInfo, success: vi.fn(), error: vi.fn() } }));

import CartPage from '../index';

const product = (id: string, name: string, price: number, stock: number) => ({
  id,
  name,
  slug: null,
  imageUrl: null,
  price,
  stock,
});

const cart: Cart = {
  groups: [
    {
      seller: { id: 's1', shopName: 'Lam Phong Tech' },
      items: [
        { product: product('p1', 'Điện thoại Minimal Phone', 12890000, 24), quantity: 1, status: 'available', lineTotal: 12890000 },
        { product: product('p2', 'Đế sạc đa năng', 1850000, 2), quantity: 2, status: 'available', lineTotal: 3700000 },
      ],
      subtotal: 16590000,
    },
    {
      seller: { id: 's2', shopName: 'Komorebi Living' },
      items: [
        { product: product('p3', 'Tai nghe gốm', 2490000, 9), quantity: 1, status: 'available', lineTotal: 2490000 },
      ],
      subtotal: 2490000,
    },
  ],
  totalAmount: 19080000,
};

const state = (over: Record<string, unknown> = {}) => ({
  mode: 'customer',
  cart,
  isPending: false,
  isError: false,
  refetch: vi.fn(),
  ...over,
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/cart']}>
      <Routes>
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<div data-testid="login-page" />} />
      </Routes>
    </MemoryRouter>
  );

describe('CartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCart.mockReturnValue(state());
  });

  it('shows a skeleton while the cart is loading', () => {
    mockUseCart.mockReturnValue(state({ cart: undefined, isPending: true }));
    renderPage();
    expect(screen.getByTestId('cart-skeleton')).toBeInTheDocument();
  });

  it('shows an error state with retry', () => {
    const refetch = vi.fn();
    mockUseCart.mockReturnValue(state({ cart: undefined, isError: true, refetch }));
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('empty cart: shows the empty state with a link back to shopping', () => {
    mockUseCart.mockReturnValue(state({ cart: { groups: [], totalAmount: 0 } }));
    renderPage();
    expect(screen.getByTestId('cart-empty')).toBeInTheDocument();
    expect(screen.getByText('Giỏ hàng của bạn đang trống')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Tiếp tục mua sắm/ })).toHaveAttribute('href', '/');
  });

  it('admin has no cart', () => {
    mockUseCart.mockReturnValue(state({ mode: 'admin', cart: undefined }));
    renderPage();
    expect(screen.getByTestId('cart-admin-notice')).toBeInTheDocument();
  });

  it('groups items per shop with a subtotal each, and shows the total', () => {
    renderPage();

    const groups = screen.getAllByTestId('cart-group');
    expect(groups).toHaveLength(2);
    expect(within(groups[0]).getByText('Lam Phong Tech')).toBeInTheDocument();
    expect(within(groups[0]).getAllByTestId('cart-item')).toHaveLength(2);
    expect(within(groups[0]).getByTestId('cart-group-subtotal')).toHaveTextContent('16.590.000');
    expect(within(groups[1]).getByTestId('cart-group-subtotal')).toHaveTextContent('2.490.000');

    expect(screen.getByTestId('cart-count')).toHaveTextContent('3 sản phẩm');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('19.080.000');
    expect(screen.getByTestId('cart-split-note')).toHaveTextContent('tách thành 2 đơn');
  });

  it('changes quantity through the stepper (capped at stock)', () => {
    renderPage();
    const first = screen.getAllByTestId('cart-item')[0];

    fireEvent.click(within(first).getByRole('button', { name: 'Tăng số lượng' }));
    expect(mockUpdate).toHaveBeenCalledWith(
      { productId: 'p1', quantity: 2, stock: 24 },
      expect.any(Object)
    );

    // p2: quantity 2 = stock 2 → không tăng thêm được
    const second = screen.getAllByTestId('cart-item')[1];
    expect(within(second).getByRole('button', { name: 'Tăng số lượng' })).toBeDisabled();
    fireEvent.click(within(second).getByRole('button', { name: 'Giảm số lượng' }));
    expect(mockUpdate).toHaveBeenLastCalledWith(
      { productId: 'p2', quantity: 1, stock: 2 },
      expect.any(Object)
    );
  });

  it('removes an item with the trash button', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Xóa Tai nghe gốm khỏi giỏ hàng/ }));
    expect(mockRemove).toHaveBeenCalledWith('p3', expect.any(Object));
  });

  it('exceeds_stock: shows the badge, a notice, excludes it from totals and "−" jumps to stock', () => {
    mockUseCart.mockReturnValue(
      state({
        cart: {
          groups: [
            {
              seller: { id: 's1', shopName: 'Shop A' },
              items: [
                { product: product('p1', 'Quần jean', 300000, 2), quantity: 5, status: 'exceeds_stock', lineTotal: 1500000 },
                { product: product('p2', 'Áo thun', 100000, 10), quantity: 1, status: 'available', lineTotal: 100000 },
              ],
              subtotal: 100000,
            },
          ],
          totalAmount: 100000,
        },
      })
    );
    renderPage();

    expect(screen.getByText('Chỉ còn 2 sản phẩm')).toBeInTheDocument();
    expect(screen.getByTestId('cart-notice')).toHaveTextContent('1 sản phẩm hiện không thể đặt mua');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('100.000');
    expect(screen.getByTestId('cart-split-note')).not.toHaveTextContent('tách thành');

    const jean = screen.getAllByTestId('cart-item')[0];
    expect(within(jean).getByRole('button', { name: 'Tăng số lượng' })).toBeDisabled();
    fireEvent.click(within(jean).getByRole('button', { name: 'Giảm số lượng' }));
    expect(mockUpdate).toHaveBeenCalledWith({ productId: 'p1', quantity: 2, stock: 2 }, expect.any(Object));

    fireEvent.click(screen.getByRole('button', { name: 'Đóng thông báo' }));
    expect(screen.queryByTestId('cart-notice')).not.toBeInTheDocument();
  });

  it('out_of_stock / unavailable: badge shown, quantity locked, still removable; checkout disabled when nothing is purchasable', () => {
    mockUseCart.mockReturnValue(
      state({
        cart: {
          groups: [
            {
              seller: { id: 's1', shopName: 'Shop A' },
              items: [
                { product: product('p1', 'Hết hàng nè', 100, 0), quantity: 1, status: 'out_of_stock', lineTotal: 100 },
                { product: product('p2', 'Ngừng bán nè', 100, 5), quantity: 1, status: 'unavailable', lineTotal: 100 },
              ],
              subtotal: 0,
            },
          ],
          totalAmount: 0,
        },
      })
    );
    renderPage();

    expect(screen.getByText('Hết hàng')).toBeInTheDocument();
    expect(screen.getByText('Sản phẩm ngừng bán')).toBeInTheDocument();
    screen.getAllByRole('button', { name: 'Tăng số lượng' }).forEach((b) => expect(b).toBeDisabled());
    screen.getAllByRole('button', { name: 'Giảm số lượng' }).forEach((b) => expect(b).toBeDisabled());
    expect(screen.getByRole('button', { name: /Xóa Hết hàng nè/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Tiến hành đặt hàng/ })).toBeDisabled();
  });

  it('guest: checkout redirects to login', () => {
    mockUseCart.mockReturnValue(state({ mode: 'guest' }));
    renderPage();
    expect(screen.getByText('Bạn cần đăng nhập để đặt hàng.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Tiến hành đặt hàng/ }));
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('customer: checkout is not available yet (US-ORD-001) → informs the user', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Tiến hành đặt hàng/ }));
    expect(mockToastInfo).toHaveBeenCalled();
  });
});
