import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MyOrder } from '@/types/order-history.types';

const { mockUseDetail } = vi.hoisted(() => ({ mockUseDetail: vi.fn() }));

vi.mock('@/hooks/queries/useMyOrders', () => ({ useMyOrderDetail: mockUseDetail }));

import OrderDetailPage from '../index';

const order = (over: Partial<MyOrder> = {}): MyOrder => ({
  id: 'o1',
  orderCode: 'ORD-88219',
  checkoutCode: 'CHK-0001',
  seller: { id: 's1', shopName: 'Lam Phong Tech' },
  items: [
    { productId: 'p1', name: 'Điện thoại Minimal Phone', imageUrl: null, price: 12890000, quantity: 1 },
    { productId: 'p2', name: 'Đế sạc đa năng', imageUrl: null, price: 1850000, quantity: 2 },
  ],
  totalAmount: 16590000,
  status: 'confirmed',
  paymentStatus: 'paid',
  paymentMethod: 'payos',
  recipient: { fullName: 'Nguyễn Văn An', phone: '0912345678', email: null, address: 'Số 18, Ngõ 42, Hà Nội' },
  cancelReason: null,
  cancelledBy: null,
  createdAt: '2026-09-15T07:32:00.000Z',
  updatedAt: null,
  ...over,
});

const state = (over: Record<string, unknown> = {}) => ({
  data: order(),
  isPending: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
  ...over,
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/account/orders/o1']}>
      <Routes>
        <Route path="/account/orders/:id" element={<OrderDetailPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('OrderDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDetail.mockReturnValue(state());
  });

  it('requests the order by route id', () => {
    renderPage();
    expect(mockUseDetail).toHaveBeenCalledWith('o1');
  });

  it('shows a skeleton while loading', () => {
    mockUseDetail.mockReturnValue(state({ data: undefined, isPending: true }));
    renderPage();
    expect(screen.getByTestId('order-detail-skeleton')).toBeInTheDocument();
  });

  it('shows "not found" for a 404', () => {
    mockUseDetail.mockReturnValue(state({ data: undefined, isError: true, error: { response: { status: 404 } } }));
    renderPage();
    expect(screen.getByTestId('order-not-found')).toBeInTheDocument();
  });

  it('shows a retryable error for other failures', () => {
    const refetch = vi.fn();
    mockUseDetail.mockReturnValue(
      state({ data: undefined, isError: true, error: { response: { status: 500 } }, refetch })
    );
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('renders header, recipient, payment and item totals', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Chi tiết đơn hàng #ORD-88219');
    expect(screen.getByTestId('order-status-badge')).toHaveTextContent('Đã xác nhận');
    expect(screen.getByTestId('order-recipient')).toHaveTextContent('Nguyễn Văn An');
    expect(screen.getByTestId('order-recipient')).toHaveTextContent('Số 18, Ngõ 42, Hà Nội');
    expect(screen.getByTestId('order-payment')).toHaveTextContent('Đã thanh toán qua PayOS');
    expect(screen.getByTestId('order-payment')).toHaveTextContent('CHK-0001');
    expect(screen.getByText('Sản phẩm trong đơn (2)')).toBeInTheDocument();
    expect(screen.getByTestId('order-subtotal').textContent).toMatch(/16\.590\.000/);
    expect(screen.getByTestId('order-detail-total').textContent).toMatch(/16\.590\.000/);
    expect(screen.queryByTestId('order-cancel-alert')).not.toBeInTheDocument();
  });

  it('shows the stepper progress for a confirmed order', () => {
    renderPage();
    expect(screen.getByTestId('order-step-confirmed')).toHaveAttribute('data-state', 'done');
    expect(screen.getByTestId('order-step-shipping')).toHaveAttribute('data-state', 'current');
    expect(screen.getByTestId('order-step-delivered')).toHaveAttribute('data-state', 'upcoming');
  });

  it('shows the cancel reason and failed step for a cancelled order', () => {
    mockUseDetail.mockReturnValue(
      state({ data: order({ status: 'cancelled', cancelReason: 'Hết hàng', cancelledBy: 'seller' }) })
    );
    renderPage();
    expect(screen.getByTestId('order-cancel-alert')).toHaveTextContent('Lý do hủy: Hết hàng');
    expect(screen.getByTestId('order-cancel-alert')).toHaveTextContent('hoàn tiền');
    expect(screen.getByTestId('order-step-cancelled')).toHaveAttribute('data-state', 'failed');
    expect(screen.getByText('Đơn hàng đã bị hủy bởi người bán')).toBeInTheDocument();
  });

  it('links back to the order list', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /Quay lại danh sách đơn mua/ })).toHaveAttribute('href', '/account/orders');
  });
});
