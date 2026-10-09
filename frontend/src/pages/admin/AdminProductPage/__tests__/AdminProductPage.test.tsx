import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminProductPage from '../index';
import { showError, showSuccess } from '@/helpers/toast';
import { SELLER_BANNED_REASON, type AdminProduct, type AdminProductsParams, type AdminProductsResult } from '../types';

const { mockUseAdminProducts, mockBlock, mockUnblock, mockRefetch } = vi.hoisted(() => ({
  mockUseAdminProducts: vi.fn(),
  mockBlock: vi.fn(),
  mockUnblock: vi.fn(),
  mockRefetch: vi.fn(),
}));

vi.mock('../services/admin-product.service', () => ({
  adminProductService: {
    useAdminProducts: mockUseAdminProducts,
    useBlockProduct: () => ({ mutateAsync: mockBlock, isPending: false }),
    useUnblockProduct: () => ({ mutateAsync: mockUnblock, isPending: false }),
  },
}));

vi.mock('@/helpers/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

const seller = { id: 'u-1', fullName: 'Người Bán', email: 'seller@example.com', shopName: 'Shop A', isActive: true };

const selling: AdminProduct = {
  id: 'p-1',
  name: 'Áo thun',
  slug: 'ao-thun',
  price: 100000,
  stock: 5,
  imageUrl: null,
  isActive: true,
  isBlocked: false,
  blockReason: null,
  category: { id: 'c-1', name: 'Thời trang' },
  seller,
  createdAt: '2026-10-01T00:00:00.000Z',
};

const blocked: AdminProduct = { ...selling, id: 'p-2', name: 'Đồng hồ nhái', isBlocked: true, blockReason: 'Hàng giả' };

const bannedSeller: AdminProduct = {
  ...selling,
  id: 'p-3',
  name: 'Giày',
  isBlocked: true,
  blockReason: SELLER_BANNED_REASON,
  seller: { ...seller, isActive: false },
};

const result = (overrides: Partial<AdminProductsResult> = {}): AdminProductsResult => ({
  items: [selling, blocked, bannedSeller],
  total: 3,
  page: 1,
  limit: 20,
  totalPages: 1,
  ...overrides,
});

const lastParams = (): AdminProductsParams => mockUseAdminProducts.mock.calls.at(-1)?.[0];

const mockQuery = (data: AdminProductsResult | undefined, extra: Record<string, unknown> = {}) =>
  mockUseAdminProducts.mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    error: null,
    refetch: mockRefetch,
    ...extra,
  });

describe('AdminProductPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery(result());
  });

  it('hiển thị tiêu đề, danh sách và khoảng bản ghi; lần đầu tải trang 1, 20 dòng', () => {
    render(<AdminProductPage />);

    expect(screen.getByRole('heading', { name: 'Kiểm duyệt sản phẩm' })).toBeInTheDocument();
    expect(screen.getByTestId('product-row-p-1')).toBeInTheDocument();
    expect(screen.getByTestId('product-range')).toHaveTextContent('Hiển thị 1–3 trong 3 sản phẩm');
    expect(lastParams()).toEqual({ page: 1, limit: 20 });
  });

  it('lọc trạng thái chặn gửi đúng isBlocked', async () => {
    render(<AdminProductPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Đang bị chặn' }));
    expect(lastParams()).toEqual({ page: 1, limit: 20, isBlocked: true });
    expect(screen.getByRole('button', { name: 'Đang bị chặn' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Không bị chặn' }));
    expect(lastParams()).toEqual({ page: 1, limit: 20, isBlocked: false });

    await userEvent.click(screen.getByRole('button', { name: 'Tất cả' }));
    expect(lastParams()).toEqual({ page: 1, limit: 20 });
  });

  it('tìm kiếm có debounce, gửi từ khóa đã trim', async () => {
    render(<AdminProductPage />);

    await userEvent.type(screen.getByLabelText('Tìm kiếm sản phẩm'), '  áo  ');
    expect(lastParams().search).toBeUndefined();

    await waitFor(() => expect(lastParams()).toEqual({ page: 1, limit: 20, search: 'áo' }), { timeout: 2000 });
  });

  it('phân trang; đổi bộ lọc thì quay về trang 1', async () => {
    mockQuery(result({ total: 41, totalPages: 3 }));
    render(<AdminProductPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Trang 3' }));
    expect(lastParams()).toMatchObject({ page: 3 });
    expect(screen.getByTestId('product-range')).toHaveTextContent('Hiển thị 41–41 trong 41 sản phẩm');

    await userEvent.click(screen.getByRole('button', { name: 'Đang bị chặn' }));
    expect(lastParams()).toMatchObject({ page: 1, isBlocked: true });
  });

  it('chặn sản phẩm: nhập lý do, xác nhận, báo thành công và đóng dialog', async () => {
    mockBlock.mockResolvedValue({ ...selling, isBlocked: true });
    render(<AdminProductPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Chặn Áo thun' }));
    const dialog = screen.getByTestId('block-product-dialog');
    await userEvent.type(within(dialog).getByLabelText(/Lý do chặn/), 'Hàng nhái thương hiệu');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Chặn sản phẩm' }));

    await waitFor(() => expect(mockBlock).toHaveBeenCalledWith({ id: 'p-1', reason: 'Hàng nhái thương hiệu' }));
    expect(showSuccess).toHaveBeenCalledWith('Đã chặn sản phẩm "Áo thun"');
    await waitFor(() => expect(screen.queryByTestId('block-product-dialog')).not.toBeInTheDocument());
  });

  it('chặn thất bại: báo lỗi, giữ dialog', async () => {
    const err = new Error('Sản phẩm đã bị chặn');
    mockBlock.mockRejectedValue(err);
    render(<AdminProductPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Chặn Áo thun' }));
    const dialog = screen.getByTestId('block-product-dialog');
    await userEvent.type(within(dialog).getByLabelText(/Lý do chặn/), 'Hàng nhái thương hiệu');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Chặn sản phẩm' }));

    await waitFor(() => expect(showError).toHaveBeenCalledWith(err));
    expect(screen.getByTestId('block-product-dialog')).toBeInTheDocument();
  });

  it('mở chặn sản phẩm', async () => {
    mockUnblock.mockResolvedValue({ ...blocked, isBlocked: false });
    render(<AdminProductPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Mở chặn Đồng hồ nhái' }));
    await userEvent.click(within(screen.getByTestId('unblock-product-dialog')).getByRole('button', { name: 'Mở chặn' }));

    expect(mockUnblock).toHaveBeenCalledWith('p-2');
    expect(showSuccess).toHaveBeenCalledWith('Đã mở chặn sản phẩm "Đồng hồ nhái"');
    await waitFor(() => expect(screen.queryByTestId('unblock-product-dialog')).not.toBeInTheDocument());
  });

  it('SP chặn do người bán đang bị khóa: không mở được từ trang này', () => {
    render(<AdminProductPage />);

    expect(screen.getByRole('button', { name: 'Mở chặn Giày' })).toBeDisabled();
  });

  it('lỗi tải danh sách: thông báo và nút tải lại', async () => {
    mockQuery(undefined, { isError: true, error: new Error('Network Error') });
    render(<AdminProductPage />);

    expect(screen.getByTestId('admin-product-error')).toHaveTextContent('Network Error');
    await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('đang lọc mà không có kết quả: báo không tìm thấy, ẩn phân trang', async () => {
    mockQuery(result({ items: [], total: 0, totalPages: 0 }));
    render(<AdminProductPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Đang bị chặn' }));

    expect(screen.getByText('Không tìm thấy sản phẩm phù hợp')).toBeInTheDocument();
    expect(screen.queryByTestId('product-range')).not.toBeInTheDocument();
  });
});
