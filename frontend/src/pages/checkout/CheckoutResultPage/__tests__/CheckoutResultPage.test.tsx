import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CheckoutResult } from '@/types/checkout-result.types';

const { mockUseResult } = vi.hoisted(() => ({ mockUseResult: vi.fn() }));
vi.mock('@/hooks/queries/useCheckoutResult', () => ({ useCheckoutResult: mockUseResult }));

import CheckoutResultPage from '../index';

const checkout = (over: Partial<CheckoutResult> = {}): CheckoutResult => ({
  checkoutCode: 'CHK-20261002-7F3K9QX2AB',
  status: 'paid',
  totalAmount: 19080000,
  orders: [
    {
      id: null,
      orderCode: 'ORD-LP-88219',
      shopName: 'Lam Phong Tech',
      totalAmount: 16590000,
      status: 'confirmed',
      items: [
        { name: 'Điện thoại Minimal Phone One', quantity: 1 },
        { name: 'Đế sạc MagBase Duo', quantity: 1 },
      ],
    },
    { id: 'o2', orderCode: 'ORD-KM-30412', shopName: 'Komorebi Living', totalAmount: 2490000, status: 'confirmed', items: [] },
  ],
  ...over,
});

const state = (over: Record<string, unknown> = {}) => ({
  data: checkout(),
  isPending: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
  ...over,
});

const renderAt = (url = '/checkout/result?checkoutCode=CHK-20261002-7F3K9QX2AB') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/checkout/result" element={<CheckoutResultPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('CheckoutResultPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseResult.mockReturnValue(state());
  });

  it('reads only checkoutCode from the URL', () => {
    renderAt('/checkout/result?checkoutCode=CHK-1&status=success&code=00');
    expect(mockUseResult).toHaveBeenCalledWith('CHK-1');
  });

  it('never trusts a forged status in the URL — the API status decides the screen', () => {
    mockUseResult.mockReturnValue(state({ data: checkout({ status: 'pending' }) }));
    renderAt('/checkout/result?checkoutCode=CHK-1&status=success');
    expect(screen.getByTestId('result-pending')).toBeInTheDocument();
    expect(screen.queryByTestId('result-success')).not.toBeInTheDocument();
  });

  it('shows "not found" when the URL has no checkoutCode', () => {
    mockUseResult.mockReturnValue(state({ data: undefined, isPending: true }));
    renderAt('/checkout/result');
    expect(screen.getByTestId('result-not-found')).toHaveTextContent('thiếu mã thanh toán');
  });

  it('shows a skeleton while the first response is loading', () => {
    mockUseResult.mockReturnValue(state({ data: undefined, isPending: true }));
    renderAt();
    expect(screen.getByTestId('result-skeleton')).toBeInTheDocument();
  });

  it('shows "not found" for a 404', () => {
    mockUseResult.mockReturnValue(
      state({ data: undefined, isError: true, error: { response: { status: 404 } } })
    );
    renderAt();
    expect(screen.getByTestId('result-not-found')).toHaveTextContent('không thuộc tài khoản của bạn');
  });

  it('shows a retryable error for other failures', () => {
    const refetch = vi.fn();
    mockUseResult.mockReturnValue(
      state({ data: undefined, isError: true, error: { response: { status: 500 } }, refetch })
    );
    renderAt();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(refetch).toHaveBeenCalled();
  });

  describe('paid', () => {
    it('shows success with the payment code and one card per shop', () => {
      renderAt();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Đặt hàng thành công');
      expect(screen.getByTestId('result-chip')).toHaveTextContent('Mã thanh toán: CHK-20261002-7F3K9QX2AB');
      expect(screen.getByText('2 gian hàng')).toBeInTheDocument();
      const cards = screen.getAllByTestId('result-order');
      expect(cards).toHaveLength(2);
      expect(within(cards[0]).getByText('Lam Phong Tech')).toBeInTheDocument();
      expect(within(cards[0]).getByText('Đơn hàng: #ORD-LP-88219')).toBeInTheDocument();
      expect(within(cards[0]).getByText(/2 sản phẩm \(Điện thoại Minimal Phone One, Đế sạc MagBase Duo\)/)).toBeInTheDocument();
      expect(within(cards[0]).getByTestId('order-status-badge')).toHaveTextContent('Đã xác nhận');
      expect(within(cards[0]).getByTestId('result-order-total').textContent).toMatch(/16\.590\.000/);
    });

    it('links to the order detail when the id is known, else to the order list', () => {
      renderAt();
      const links = screen.getAllByRole('link', { name: 'Xem chi tiết' });
      expect(links[0]).toHaveAttribute('href', '/account/orders');
      expect(links[1]).toHaveAttribute('href', '/account/orders/o2');
    });

    it('offers "Xem đơn mua" and "Tiếp tục mua sắm"', () => {
      renderAt();
      expect(screen.getByRole('link', { name: 'Xem đơn mua' })).toHaveAttribute('href', '/account/orders');
      expect(screen.getByRole('link', { name: 'Tiếp tục mua sắm' })).toHaveAttribute('href', '/');
    });
  });

  describe('pending', () => {
    it('shows the processing view without any action buttons', () => {
      mockUseResult.mockReturnValue(state({ data: checkout({ status: 'pending' }) }));
      renderAt();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Đang xác nhận thanh toán...');
      expect(screen.getByTestId('result-pending')).toHaveAttribute('aria-live', 'polite');
      expect(screen.getByText('Đang xử lý...')).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe.each([
    ['failed', 'Thanh toán không thành công', 'Đơn hàng đã được hủy và sản phẩm đã được hoàn lại kho.'],
    ['expired', 'Đơn hàng đã hết hạn thanh toán', 'thanh toán trong 30 phút'],
  ] as const)('%s', (status, title, text) => {
    beforeEach(() => {
      mockUseResult.mockReturnValue(
        state({
          data: checkout({
            status,
            orders: [
              { id: null, orderCode: 'ORD-LP-88219', shopName: 'Lam Phong Tech', totalAmount: 1, status: 'cancelled', items: [] },
            ],
          }),
        })
      );
    });

    it('explains what happened and that stock is restored but the cart is kept', () => {
      renderAt();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title);
      expect(screen.getByText(new RegExp(text))).toBeInTheDocument();
      expect(screen.getByText('Đã hoàn lại')).toBeInTheDocument();
      expect(screen.getByText('Được giữ nguyên')).toBeInTheDocument();
      expect(screen.getByTestId('result-icon-danger')).toBeInTheDocument();
    });

    it('lists the cancelled orders and links back to the cart / home', () => {
      renderAt();
      expect(screen.getByTestId('order-status-badge')).toHaveTextContent('Đã hủy');
      expect(screen.getByText('Mã đơn: #ORD-LP-88219')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Quay lại giỏ hàng/ })).toHaveAttribute('href', '/cart');
      expect(screen.getByRole('link', { name: /Về trang chủ/ })).toHaveAttribute('href', '/');
    });
  });

  it('only the failed view shows the gateway notice', () => {
    mockUseResult.mockReturnValue(state({ data: checkout({ status: 'failed', orders: [] }) }));
    renderAt();
    expect(screen.getByText(/chưa được hoàn tất hoặc đã hết thời hạn giữ đơn/)).toBeInTheDocument();
  });
});
