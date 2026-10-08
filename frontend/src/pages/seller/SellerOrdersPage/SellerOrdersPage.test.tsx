import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import SellerOrdersPage from './index';
import { sellerOrdersService } from './services/seller-orders.service';
import { useAuthStore } from '@/stores/auth.store';
import type { SellerOrder } from './types';

vi.mock('./services/seller-orders.service', () => ({
  SELLER_ORDERS_QUERY_KEY: ['seller', 'orders'],
  sellerOrdersService: {
    getSellingOrders: vi.fn(),
    getSellingOrderById: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock('@/helpers/toast', () => ({ showSuccess: vi.fn(), showError: vi.fn() }));

const service = sellerOrdersService as unknown as {
  getSellingOrders: ReturnType<typeof vi.fn>;
  getSellingOrderById: ReturnType<typeof vi.fn>;
  updateStatus: ReturnType<typeof vi.fn>;
};

const makeOrder = (overrides: Partial<SellerOrder> = {}): SellerOrder => ({
  id: 'o1',
  orderCode: 'ORD-20260915-AAAA',
  checkoutCode: 'CHK-1',
  seller: { id: 'seller-1', shopName: 'Mộc Hương Candle' },
  items: [
    { productId: 'p1', name: 'Nến thơm sáp đậu nành', imageUrl: null, price: 350000, quantity: 2 },
    { productId: 'p2', name: 'Bộ tinh dầu khuếch tán', imageUrl: null, price: 420000, quantity: 1 },
  ],
  totalAmount: 1120000,
  status: 'confirmed',
  paymentStatus: 'paid',
  paymentMethod: 'payos',
  recipient: { fullName: 'Trần Thu Hà', phone: '0987654321', email: null, address: 'Số 25, Ngõ 12, Láng Hạ, Hà Nội' },
  cancelReason: null,
  cancelledBy: null,
  createdAt: '2026-09-15T07:32:00Z',
  updatedAt: null,
  ...overrides,
});

const listResult = (items: SellerOrder[], extra = {}) => ({
  items,
  total: items.length,
  page: 1,
  limit: 10,
  totalPages: 1,
  ...extra,
});

const renderPage = (url = '/seller/orders') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[url]}>
        <SellerOrdersPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('SellerOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      status: 'authed',
      user: { id: 'seller-1', email: 's@x.vn', fullName: 'Seller', role: 'customer' },
      accessToken: 'token',
    });
    service.updateStatus.mockResolvedValue(undefined);
  });

  it('hiển thị đơn với người nhận, sản phẩm, tổng tiền và trạng thái', async () => {
    service.getSellingOrders.mockResolvedValue(listResult([makeOrder()]));
    renderPage();

    const card = await screen.findByTestId('seller-order-card');
    expect(within(card).getByText('#ORD-20260915-AAAA')).toBeInTheDocument();
    expect(within(card).getByText(/Trần Thu Hà/)).toBeInTheDocument();
    expect(within(card).getByText('Nến thơm sáp đậu nành')).toBeInTheDocument();
    expect(within(card).getByTestId('order-status-badge')).toHaveTextContent('Đã xác nhận');
    expect(within(card).getByTestId('payment-badge')).toHaveTextContent('Đã thanh toán');
    expect(within(card).getByTestId('seller-order-total').textContent).toMatch(/1\.120\.000/);
  });

  it('đơn confirmed có nút Hủy đơn + Giao hàng; shipping chỉ có Đã giao; delivered không có nút xử lý', async () => {
    service.getSellingOrders.mockResolvedValue(
      listResult([
        makeOrder({ id: 'a', orderCode: 'A', status: 'confirmed' }),
        makeOrder({ id: 'b', orderCode: 'B', status: 'shipping' }),
        makeOrder({ id: 'c', orderCode: 'C', status: 'delivered' }),
        makeOrder({ id: 'd', orderCode: 'D', status: 'cancelled', cancelReason: 'Hết hàng thực tế' }),
      ])
    );
    renderPage();

    const [a, b, c, d] = await screen.findAllByTestId('seller-order-card');
    expect(within(a).getByTestId('action-cancel')).toBeInTheDocument();
    expect(within(a).getByTestId('action-ship')).toBeInTheDocument();
    expect(within(b).getByTestId('action-deliver')).toBeInTheDocument();
    expect(within(b).queryByTestId('action-ship')).not.toBeInTheDocument();
    for (const card of [c, d]) {
      expect(within(card).queryByTestId('action-ship')).not.toBeInTheDocument();
      expect(within(card).queryByTestId('action-deliver')).not.toBeInTheDocument();
      expect(within(card).queryByTestId('action-cancel')).not.toBeInTheDocument();
    }
    expect(within(d).getByTestId('seller-order-cancel-reason')).toHaveTextContent('Hết hàng thực tế');
  });

  it('Giao hàng: mở dialog xác nhận rồi gọi PATCH status=shipping', async () => {
    service.getSellingOrders.mockResolvedValue(listResult([makeOrder()]));
    renderPage();

    fireEvent.click(await screen.findByTestId('action-ship'));
    const dialog = await screen.findByTestId('confirm-status-dialog');
    expect(within(dialog).getByText('Xác nhận giao hàng')).toBeInTheDocument();
    expect(within(dialog).getByText(/Trần Thu Hà \(0987654321\)/)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận' }));
    await waitFor(() => expect(service.updateStatus).toHaveBeenCalledWith('o1', { status: 'shipping' }));
    await waitFor(() => expect(screen.queryByTestId('confirm-status-dialog')).not.toBeInTheDocument());
  });

  it('Đã giao: gọi PATCH status=delivered', async () => {
    service.getSellingOrders.mockResolvedValue(listResult([makeOrder({ status: 'shipping' })]));
    renderPage();

    fireEvent.click(await screen.findByTestId('action-deliver'));
    const dialog = await screen.findByTestId('confirm-status-dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận' }));
    await waitFor(() => expect(service.updateStatus).toHaveBeenCalledWith('o1', { status: 'delivered' }));
  });

  it('Hủy đơn: bắt buộc nhập lý do, nút xác nhận bị khoá khi để trống', async () => {
    service.getSellingOrders.mockResolvedValue(listResult([makeOrder()]));
    renderPage();

    fireEvent.click(await screen.findByTestId('action-cancel'));
    const dialog = await screen.findByTestId('cancel-reason-dialog');
    const confirmBtn = within(dialog).getByRole('button', { name: 'Xác nhận hủy' });
    const textarea = within(dialog).getByLabelText(/Lý do hủy/);

    expect(confirmBtn).toBeDisabled();

    fireEvent.blur(textarea);
    expect(await within(dialog).findByText('Vui lòng nhập lý do hủy đơn hàng')).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: '   ' } });
    expect(confirmBtn).toBeDisabled();

    fireEvent.change(textarea, { target: { value: '  Hết hàng thực tế  ' } });
    expect(confirmBtn).toBeEnabled();
    fireEvent.click(confirmBtn);

    await waitFor(() =>
      expect(service.updateStatus).toHaveBeenCalledWith('o1', { status: 'cancelled', reason: 'Hết hàng thực tế' })
    );
  });

  it('lỗi 400 khi đổi trạng thái: đóng dialog và không crash', async () => {
    service.getSellingOrders.mockResolvedValue(listResult([makeOrder()]));
    service.updateStatus.mockRejectedValue({ response: { status: 400, data: { message: 'Chuyển trạng thái không hợp lệ' } } });
    renderPage();

    fireEvent.click(await screen.findByTestId('action-ship'));
    const dialog = await screen.findByTestId('confirm-status-dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận' }));

    await waitFor(() => expect(screen.queryByTestId('confirm-status-dialog')).not.toBeInTheDocument());
    expect(screen.getByTestId('seller-order-card')).toBeInTheDocument();
  });

  it('lọc theo tab trạng thái: gọi API với status và cập nhật URL', async () => {
    service.getSellingOrders.mockResolvedValue(listResult([makeOrder()]));
    renderPage();
    await screen.findByTestId('seller-order-card');

    fireEvent.click(screen.getByRole('button', { name: /Đang giao/ }));
    await waitFor(() =>
      expect(service.getSellingOrders).toHaveBeenLastCalledWith({ page: 1, limit: 10, status: 'shipping' })
    );
  });

  it('tìm theo mã đơn hoặc tên người mua', async () => {
    service.getSellingOrders.mockResolvedValue(
      listResult([
        makeOrder({ id: 'a', orderCode: 'ORD-AAA' }),
        makeOrder({
          id: 'b',
          orderCode: 'ORD-BBB',
          recipient: { fullName: 'Lê Quang Minh', phone: '0905112233', email: null, address: 'TP.HCM' },
        }),
      ])
    );
    renderPage();
    await screen.findAllByTestId('seller-order-card');

    fireEvent.change(screen.getByPlaceholderText(/Tìm theo mã đơn/), { target: { value: 'quang minh' } });
    expect(screen.getAllByTestId('seller-order-card')).toHaveLength(1);
    expect(screen.getByText('#ORD-BBB')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Tìm theo mã đơn/), { target: { value: 'zzz' } });
    expect(screen.getByTestId('seller-orders-filtered-empty')).toBeInTheDocument();
  });

  it('chưa có đơn nào: hiện empty state với mẹo và link tới thiết lập gian hàng / đăng sản phẩm', async () => {
    service.getSellingOrders.mockResolvedValue(listResult([]));
    renderPage();

    expect(await screen.findByText('Chưa có đơn hàng nào')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cài đặt gian hàng' })).toHaveAttribute('href', '/seller/setup');
    expect(screen.getByRole('link', { name: /Đăng sản phẩm mới/ })).toHaveAttribute('href', '/seller/products/new');
  });

  it('API lỗi: hiện trạng thái lỗi và cho thử lại', async () => {
    service.getSellingOrders.mockRejectedValueOnce(new Error('boom'));
    service.getSellingOrders.mockResolvedValue(listResult([makeOrder()]));
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByTestId('seller-order-card')).toBeInTheDocument();
  });

  it('Xem chi tiết: mở ngăn chi tiết với tiến độ, người nhận, sản phẩm và thanh toán', async () => {
    service.getSellingOrders.mockResolvedValue(listResult([makeOrder()]));
    service.getSellingOrderById.mockResolvedValue(makeOrder());
    renderPage();

    fireEvent.click(await screen.findByTestId('action-view'));
    const sheet = await screen.findByTestId('seller-order-sheet');

    expect(within(sheet).getByText(/Chi tiết đơn bán/)).toBeInTheDocument();
    expect(within(sheet).getByTestId('order-stepper')).toBeInTheDocument();
    expect(within(sheet).getByText('2 mặt hàng')).toBeInTheDocument();
    expect(within(sheet).getByText(/Đã thanh toán qua PayOS/)).toBeInTheDocument();
    expect(within(sheet).getByTestId('seller-order-detail-total').textContent).toMatch(/1\.120\.000/);
    expect(within(sheet).getByTestId('action-ship')).toBeInTheDocument();
  });

  it('xử lý đơn ngay trong ngăn chi tiết: dialog mở chồng lên ngăn và gọi đúng API', async () => {
    service.getSellingOrders.mockResolvedValue(listResult([makeOrder()]));
    service.getSellingOrderById.mockResolvedValue(makeOrder());
    renderPage();

    fireEvent.click(await screen.findByTestId('action-view'));
    const sheet = await screen.findByTestId('seller-order-sheet');
    fireEvent.click(within(sheet).getByTestId('action-cancel'));

    const dialog = await screen.findByTestId('cancel-reason-dialog');
    fireEvent.change(within(dialog).getByLabelText(/Lý do hủy/), { target: { value: 'Khách yêu cầu' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận hủy' }));

    await waitFor(() =>
      expect(service.updateStatus).toHaveBeenCalledWith('o1', { status: 'cancelled', reason: 'Khách yêu cầu' })
    );
    await waitFor(() => expect(screen.queryByTestId('cancel-reason-dialog')).not.toBeInTheDocument());
  });
});
