import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MyOrder } from '@/types/order-history.types';

const { mockUseMyOrders } = vi.hoisted(() => ({ mockUseMyOrders: vi.fn() }));

vi.mock('@/hooks/queries/useMyOrders', () => ({ useMyOrders: mockUseMyOrders }));

import OrderHistoryPage from '../index';

const order = (over: Partial<MyOrder> = {}): MyOrder => ({
  id: 'o1',
  orderCode: 'ORD-1',
  checkoutCode: 'CHK-1',
  seller: { id: 's1', shopName: 'Lam Phong Tech' },
  items: [{ productId: 'p1', name: 'Điện thoại Minimal Phone', imageUrl: null, price: 12890000, quantity: 1 }],
  totalAmount: 12890000,
  status: 'confirmed',
  paymentStatus: 'paid',
  paymentMethod: 'payos',
  recipient: null,
  cancelReason: null,
  cancelledBy: null,
  createdAt: '2026-09-15T07:32:00.000Z',
  updatedAt: null,
  ...over,
});

const result = (items: MyOrder[], over: Record<string, unknown> = {}) => ({
  data: { items, total: items.length, page: 1, limit: 10, totalPages: 1 },
  isPending: false,
  isError: false,
  isPlaceholderData: false,
  refetch: vi.fn(),
  ...over,
});

const Where = () => {
  const { search } = useLocation();
  return <div data-testid="where">{search}</div>;
};

const renderPage = (url = '/account/orders') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/account/orders" element={<><OrderHistoryPage /><Where /></>} />
      </Routes>
    </MemoryRouter>
  );

describe('OrderHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMyOrders.mockReturnValue(result([order()]));
  });

  it('shows a skeleton while loading', () => {
    mockUseMyOrders.mockReturnValue(result([], { data: undefined, isPending: true }));
    renderPage();
    expect(screen.getByTestId('orders-skeleton')).toBeInTheDocument();
  });

  it('shows an error state with retry', () => {
    const refetch = vi.fn();
    mockUseMyOrders.mockReturnValue(result([], { data: undefined, isError: true, refetch }));
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('shows the empty state with a shopping link', () => {
    mockUseMyOrders.mockReturnValue(result([]));
    renderPage();
    expect(screen.getByText('Bạn chưa có đơn hàng nào')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mua sắm ngay' })).toHaveAttribute('href', '/');
  });

  it('shows a filtered-empty state that can return to "Tất cả"', () => {
    mockUseMyOrders.mockReturnValue(result([]));
    renderPage('/account/orders?status=shipping');
    fireEvent.click(screen.getByRole('button', { name: 'Xem tất cả đơn' }));
    expect(screen.getByTestId('where').textContent).toBe('');
  });

  it('requests orders with the status and page from the URL', () => {
    renderPage('/account/orders?status=delivered&page=2');
    expect(mockUseMyOrders).toHaveBeenCalledWith({ page: 2, limit: 10, status: 'delivered' });
  });

  it('groups orders from the same checkout under one header', () => {
    mockUseMyOrders.mockReturnValue(
      result([
        order({ id: 'a', orderCode: 'ORD-A' }),
        order({ id: 'b', orderCode: 'ORD-B', seller: { id: 's2', shopName: 'Komorebi Living' } }),
        order({ id: 'c', orderCode: 'ORD-C', checkoutCode: 'CHK-2' }),
      ])
    );
    renderPage();
    const groups = screen.getAllByTestId('order-group');
    expect(groups).toHaveLength(2);
    expect(within(groups[0]).getByText('2 đơn hàng')).toBeInTheDocument();
    expect(within(groups[0]).getAllByTestId('order-card')).toHaveLength(2);
    expect(within(groups[0]).getByText(/Thanh toán CHK-1/)).toBeInTheDocument();
  });

  it('renders quantity breakdown, total, badge and detail link', () => {
    mockUseMyOrders.mockReturnValue(
      result([
        order({
          id: 'x1',
          items: [{ productId: 'p2', name: 'Đế sạc đa năng', imageUrl: null, price: 1850000, quantity: 2 }],
          totalAmount: 3700000,
        }),
      ])
    );
    renderPage();
    expect(screen.getByText(/Số lượng: 2 \(2 × /)).toBeInTheDocument();
    expect(screen.getByTestId('order-total').textContent).toMatch(/3\.700\.000/);
    expect(screen.getByTestId('order-status-badge')).toHaveTextContent('Đã xác nhận');
    expect(screen.getByRole('link', { name: 'Xem chi tiết' })).toHaveAttribute('href', '/account/orders/x1');
  });

  it('notes that admin will refund a paid cancelled order', () => {
    mockUseMyOrders.mockReturnValue(result([order({ status: 'cancelled', paymentStatus: 'paid' })]));
    renderPage();
    expect(screen.getByText('Quản trị viên sẽ hoàn tiền cho bạn')).toBeInTheDocument();
  });

  it('hides orders that do not match the active tab even if the API ignored the filter', () => {
    mockUseMyOrders.mockReturnValue(
      result([order({ id: 'a', status: 'shipping' }), order({ id: 'b', status: 'delivered', checkoutCode: 'CHK-9' })])
    );
    renderPage('/account/orders?status=shipping');
    expect(screen.getAllByTestId('order-card')).toHaveLength(1);
  });

  it('writes the chosen tab to the URL and resets the page', () => {
    renderPage('/account/orders?page=3');
    fireEvent.click(screen.getByRole('button', { name: 'Đang giao' }));
    expect(screen.getByTestId('where')).toHaveTextContent('?status=shipping');
    expect(screen.getByTestId('where').textContent).not.toContain('page');
  });

  it('paginates through the URL', () => {
    mockUseMyOrders.mockReturnValue({
      ...result([order()]),
      data: { items: [order()], total: 30, page: 1, limit: 10, totalPages: 3 },
    });
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Trang 2' }));
    expect(screen.getByTestId('where')).toHaveTextContent('?page=2');
  });
});
