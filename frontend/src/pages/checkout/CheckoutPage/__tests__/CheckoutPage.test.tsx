import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Cart, CartItemStatus } from '@/types/cart.types';

const { mockUseCart, mockMutate, mockProfile, mockShowError, mockRedirect, mutationState } = vi.hoisted(() => ({
  mockUseCart: vi.fn(),
  mockMutate: vi.fn(),
  mockProfile: vi.fn(),
  mockShowError: vi.fn(),
  mockRedirect: vi.fn(),
  mutationState: { isPending: false, isSuccess: false },
}));

vi.mock('@/hooks/queries/useCart', () => ({ useCart: mockUseCart }));
vi.mock('../hooks/useCreateCheckout', () => ({
  useCreateCheckout: () => ({ mutate: mockMutate, ...mutationState }),
}));
vi.mock('@/services/user.service', () => ({
  userService: { useGetProfile: () => mockProfile() },
}));
vi.mock('@/helpers/checkout', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/helpers/checkout')>()),
  redirectToPayment: mockRedirect,
}));
vi.mock('@/helpers/toast', () => ({ showError: mockShowError, showSuccess: vi.fn() }));

import CheckoutPage from '../index';

const line = (id: string, name: string, price: number, qty: number, status: CartItemStatus = 'available', stock = 10) => ({
  product: { id, name, slug: null, imageUrl: null, price, stock },
  quantity: qty,
  status,
  lineTotal: price * qty,
});

const cart: Cart = {
  groups: [
    {
      seller: { id: 's1', shopName: 'Lam Phong Tech' },
      items: [line('p1', 'Điện thoại Minimal', 12890000, 1), line('p2', 'Đế sạc đa năng', 1850000, 2)],
      subtotal: 16590000,
    },
    { seller: { id: 's2', shopName: 'Komorebi Living' }, items: [line('p3', 'Tai nghe gốm', 2490000, 1)], subtotal: 2490000 },
  ],
  totalAmount: 19080000,
};

const completeProfile = {
  data: { fullName: 'Nguyễn Văn An', phone: '0912345678', address: 'Số 18, Ngõ 42, Hà Nội', shop: null },
  isPending: false,
  isError: false,
  refetch: vi.fn(),
};

const cartState = (over: Record<string, unknown> = {}) => ({
  mode: 'customer',
  cart,
  isPending: false,
  isError: false,
  refetch: vi.fn(),
  ...over,
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/checkout']}>
      <Routes>
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/cart" element={<div data-testid="cart-route" />} />
      </Routes>
    </MemoryRouter>
  );

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutationState.isPending = false;
    mutationState.isSuccess = false;
    mockUseCart.mockReturnValue(cartState());
    mockProfile.mockReturnValue(completeProfile);
  });

  it('shows a skeleton while loading', () => {
    mockUseCart.mockReturnValue(cartState({ cart: undefined, isPending: true }));
    renderPage();
    expect(screen.getByTestId('checkout-skeleton')).toBeInTheDocument();
  });

  it('shows an error state with retry', () => {
    const refetch = vi.fn();
    mockUseCart.mockReturnValue(cartState({ cart: undefined, isError: true, refetch }));
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('empty cart / admin / nothing purchasable show their own states', () => {
    mockUseCart.mockReturnValue(cartState({ cart: { groups: [], totalAmount: 0 } }));
    const { unmount } = renderPage();
    expect(screen.getByTestId('checkout-empty')).toBeInTheDocument();
    unmount();

    mockUseCart.mockReturnValue(cartState({ mode: 'admin', cart: undefined }));
    const second = renderPage();
    expect(screen.getByTestId('checkout-admin-notice')).toBeInTheDocument();
    second.unmount();
  });

  it('breadcrumb: Trang chủ > Giỏ hàng > Thanh toán', () => {
    renderPage();
    const nav = screen.getByRole('navigation', { name: 'Đường dẫn' });
    expect(within(nav).getByRole('link', { name: 'Trang chủ' })).toHaveAttribute('href', '/');
    expect(within(nav).getByRole('link', { name: 'Giỏ hàng' })).toHaveAttribute('href', '/cart');
    expect(within(nav).getByText('Thanh toán')).toHaveAttribute('aria-current', 'page');
  });

  it('happy path: recipient form prefilled from profile (name, phone, address), items grouped per shop, total and split note', () => {
    renderPage();
    expect(screen.getByLabelText(/Họ và tên/)).toHaveValue('Nguyễn Văn An');
    expect(screen.getByLabelText(/Số điện thoại/)).toHaveValue('0912345678');
    expect(screen.getByLabelText(/Địa chỉ giao hàng/)).toHaveValue('Số 18, Ngõ 42, Hà Nội');

    const groups = screen.getAllByTestId('checkout-group');
    expect(groups).toHaveLength(2);
    expect(within(groups[0]).getAllByTestId('checkout-item')).toHaveLength(2);
    expect(within(groups[0]).getByTestId('checkout-group-subtotal')).toHaveTextContent('16.590.000');

    expect(screen.getByTestId('checkout-total')).toHaveTextContent('19.080.000');
    expect(screen.getByTestId('checkout-split-note')).toHaveTextContent('tách thành 2 đơn');
    expect(screen.queryByTestId('checkout-issue-alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thanh toán với VNPay/ })).toBeEnabled();
  });

  it('pays with recipient + productId/quantity only (no price / sellerId) and redirects to paymentUrl', () => {
    mockMutate.mockImplementation((_payload, opts) =>
      opts.onSuccess({ paymentUrl: 'https://pay.payos.vn/web/abc123' })
    );

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Thanh toán với VNPay/ }));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate.mock.calls[0][0]).toEqual({
      recipient: { fullName: 'Nguyễn Văn An', phone: '0912345678', address: 'Số 18, Ngõ 42, Hà Nội' },
      items: [
        { productId: 'p1', quantity: 1 },
        { productId: 'p2', quantity: 2 },
        { productId: 'p3', quantity: 1 },
      ],
    });
    expect(mockRedirect).toHaveBeenCalledWith('https://pay.payos.vn/web/abc123');
  });

  it('profile missing phone/address: form is empty there, payment blocked until filled in', async () => {
    mockProfile.mockReturnValue({ ...completeProfile, data: { ...completeProfile.data, phone: null, address: null } });
    renderPage();

    expect(screen.getByLabelText(/Số điện thoại/)).toHaveValue('');
    expect(screen.getByRole('button', { name: /Thanh toán với VNPay/ })).toBeDisabled();
    expect(screen.getByTestId('checkout-disabled-reason')).toBeInTheDocument();

    fireEvent.blur(screen.getByLabelText(/Số điện thoại/));
    expect(await screen.findByText('Vui lòng nhập số điện thoại')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Số điện thoại/), { target: { value: '0987654321' } });
    fireEvent.change(screen.getByLabelText(/Địa chỉ giao hàng/), { target: { value: '12 Lê Lợi, Quận 1, TP.HCM' } });

    await waitFor(() => expect(screen.getByRole('button', { name: /Thanh toán với VNPay/ })).toBeEnabled());
  });

  it('invalid phone number shows an error and blocks payment', async () => {
    renderPage();
    const phone = screen.getByLabelText(/Số điện thoại/);
    fireEvent.change(phone, { target: { value: '123' } });
    fireEvent.blur(phone);

    expect(await screen.findByText('Số điện thoại không hợp lệ')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thanh toán với VNPay/ })).toBeDisabled();
  });

  it('buyer can edit name / phone / address and the edited values are what gets sent', async () => {
    mockMutate.mockImplementation(() => undefined);
    renderPage();

    fireEvent.change(screen.getByLabelText(/Họ và tên/), { target: { value: 'Trần Thị Bình' } });
    fireEvent.change(screen.getByLabelText(/Số điện thoại/), { target: { value: '+84987654321' } });
    fireEvent.change(screen.getByLabelText(/Địa chỉ giao hàng/), { target: { value: 'Địa chỉ mới 99 Hai Bà Trưng' } });

    const pay = screen.getByRole('button', { name: /Thanh toán với VNPay/ });
    await waitFor(() => expect(pay).toBeEnabled());
    fireEvent.click(pay);

    expect(mockMutate.mock.calls[0][0].recipient).toEqual({
      fullName: 'Trần Thị Bình',
      phone: '+84987654321',
      address: 'Địa chỉ mới 99 Hai Bà Trưng',
    });
  });

  it('stock issue in the cart: red alert, blocked VNPay, update-cart action, nothing is sent', () => {
    mockUseCart.mockReturnValue(
      cartState({
        cart: {
          groups: [
            {
              seller: { id: 's1', shopName: 'Lam Phong Tech' },
              items: [line('p2', 'Đế sạc đa năng', 990000, 2, 'exceeds_stock', 1)],
              subtotal: 0,
            },
            { seller: { id: 's2', shopName: 'Audio Craft' }, items: [line('p5', 'Tai nghe MasterSound', 17100000, 1)], subtotal: 17100000 },
          ],
          totalAmount: 17100000,
        },
      })
    );
    renderPage();

    expect(screen.getByTestId('checkout-issue-alert')).toHaveTextContent('Một số sản phẩm không đủ hàng');
    expect(screen.getByTestId('checkout-issue-line')).toHaveTextContent('Bạn yêu cầu 2 sản phẩm, hiện chỉ còn 1 sản phẩm.');
    expect(screen.getByTestId('checkout-item-issue')).toHaveTextContent('Chỉ còn 1 sản phẩm trong kho (Bạn chọn 2)');
    expect(screen.getByRole('button', { name: 'Thanh toán với VNPay' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Cập nhật lại giỏ hàng' })).toHaveAttribute('href', '/cart');
    expect(screen.getByText(/giải quyết cảnh báo tồn kho/)).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('BE 400 shortage after clicking pay: shows the alert and locks payment', async () => {
    mockMutate.mockImplementation((_payload, opts) =>
      opts.onError({
        response: {
          data: { message: 'Một số sản phẩm không đủ tồn kho', errors: [{ productId: 'p2', name: 'Đế sạc đa năng', available: 1, requested: 2 }] },
        },
      })
    );
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Thanh toán với VNPay/ }));

    expect(await screen.findByTestId('checkout-issue-alert')).toBeInTheDocument();
    expect(screen.getByTestId('checkout-issue-line')).toHaveTextContent('Lam Phong Tech');
    expect(screen.getByRole('button', { name: 'Thanh toán với VNPay' })).toBeDisabled();
    expect(mockShowError).not.toHaveBeenCalled();
  });

  it('other API errors are shown as a toast message', () => {
    mockMutate.mockImplementation((_payload, opts) =>
      opts.onError({ response: { data: { message: 'Bạn không thể mua sản phẩm của chính mình' } } })
    );
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Thanh toán với VNPay/ }));
    expect(mockShowError).toHaveBeenCalledWith('Bạn không thể mua sản phẩm của chính mình');
    expect(screen.queryByTestId('checkout-issue-alert')).not.toBeInTheDocument();
  });

  it('disables the pay button while the checkout is being created (no double submit)', () => {
    mutationState.isPending = true;
    renderPage();
    expect(screen.getByRole('button', { name: /Đang chuyển tới VNPay/ })).toBeDisabled();
  });
});
