import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminUserPage from '../index';
import { showError, showSuccess } from '@/helpers/toast';
import type { AdminUser, AdminUsersParams, AdminUsersResult } from '../types';

const { mockUseAdminUsers, mockBan, mockUnban, mockRefetch } = vi.hoisted(() => ({
  mockUseAdminUsers: vi.fn(),
  mockBan: vi.fn(),
  mockUnban: vi.fn(),
  mockRefetch: vi.fn(),
}));

vi.mock('../services/admin-user.service', () => ({
  adminUserService: {
    useAdminUsers: mockUseAdminUsers,
    useBanUser: () => ({ mutateAsync: mockBan, isPending: false }),
    useUnbanUser: () => ({ mutateAsync: mockUnban, isPending: false }),
  },
}));

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (s: { user: { id: string; role: string } }) => unknown) =>
    selector({ user: { id: 'admin-1', role: 'admin' } }),
}));

vi.mock('@/helpers/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

const seller: AdminUser = {
  id: 'u-1',
  email: 'seller@example.com',
  fullName: 'Nguyễn Văn An',
  phone: null,
  role: 'customer',
  isActive: true,
  shop: { shopName: 'Shop A', shopSlug: 'shop-a' },
  productCount: 7,
  createdAt: '2026-10-01T00:00:00.000Z',
};

const banned: AdminUser = {
  ...seller,
  id: 'u-2',
  email: 'banned@example.com',
  fullName: 'Trần Thị Bình',
  isActive: false,
  shop: null,
  productCount: 0,
};

const self: AdminUser = { ...seller, id: 'admin-1', email: 'admin@example.com', fullName: 'Quản Trị', role: 'admin', shop: null };

const result = (overrides: Partial<AdminUsersResult> = {}): AdminUsersResult => ({
  items: [seller, banned, self],
  total: 3,
  page: 1,
  limit: 20,
  totalPages: 1,
  ...overrides,
});

const lastParams = (): AdminUsersParams => mockUseAdminUsers.mock.calls.at(-1)?.[0];

const mockQuery = (data: AdminUsersResult | undefined, extra: Record<string, unknown> = {}) =>
  mockUseAdminUsers.mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    error: null,
    refetch: mockRefetch,
    ...extra,
  });

describe('AdminUserPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery(result());
  });

  it('hiển thị tiêu đề, danh sách và khoảng bản ghi; lần đầu tải trang 1, 20 dòng', () => {
    render(<AdminUserPage title="Quản lý người dùng" />);

    expect(screen.getByRole('heading', { name: 'Quản lý người dùng' })).toBeInTheDocument();
    expect(screen.getByTestId('user-row-u-1')).toBeInTheDocument();
    expect(screen.getByTestId('user-range')).toHaveTextContent('Hiển thị 1–3 trong 3 người dùng');
    expect(lastParams()).toEqual({ page: 1, limit: 20 });
  });

  it('không truyền title thì dùng "Người dùng"', () => {
    render(<AdminUserPage />);

    expect(screen.getByRole('heading', { name: 'Người dùng' })).toBeInTheDocument();
  });

  it('lọc vai trò và trạng thái gửi đúng tham số', async () => {
    render(<AdminUserPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Quản trị viên' }));
    expect(lastParams()).toEqual({ page: 1, limit: 20, role: 'admin' });
    expect(screen.getByRole('button', { name: 'Quản trị viên' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Đã khóa' }));
    expect(lastParams()).toEqual({ page: 1, limit: 20, role: 'admin', isActive: false });

    await userEvent.click(screen.getByRole('button', { name: 'Hoạt động' }));
    expect(lastParams()).toMatchObject({ isActive: true });

    await userEvent.click(screen.getByRole('button', { name: 'Tất cả vai trò' }));
    await userEvent.click(screen.getByRole('button', { name: 'Tất cả' }));
    expect(lastParams()).toEqual({ page: 1, limit: 20 });
  });

  it('tìm kiếm có debounce: chỉ gửi từ khóa (đã trim) sau khi ngừng gõ', async () => {
    render(<AdminUserPage />);

    await userEvent.type(screen.getByLabelText('Tìm kiếm người dùng'), '  shop a ');
    expect(lastParams().search).toBeUndefined();

    await waitFor(() => expect(lastParams()).toEqual({ page: 1, limit: 20, search: 'shop a' }), {
      timeout: 2000,
    });
  });

  it('phân trang; đổi bộ lọc thì quay về trang 1', async () => {
    mockQuery(result({ total: 45, totalPages: 3 }));
    render(<AdminUserPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Trang 2' }));
    expect(lastParams()).toMatchObject({ page: 2 });
    expect(screen.getByTestId('user-range')).toHaveTextContent('Hiển thị 21–40 trong 45 người dùng');

    await userEvent.click(screen.getByRole('button', { name: 'Khách hàng' }));
    expect(lastParams()).toMatchObject({ page: 1, role: 'customer' });
  });

  it('khóa tài khoản: mở dialog, xác nhận, báo thành công và đóng dialog', async () => {
    mockBan.mockResolvedValue('Đã khóa tài khoản và chặn gian hàng/sản phẩm');
    render(<AdminUserPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Khóa tài khoản Nguyễn Văn An' }));
    const dialog = screen.getByTestId('user-moderation-dialog');
    expect(within(dialog).getByTestId('ban-warning')).toHaveTextContent('7 sản phẩm');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Khóa tài khoản' }));

    expect(mockBan).toHaveBeenCalledWith('u-1');
    expect(showSuccess).toHaveBeenCalledWith('Đã khóa tài khoản và chặn gian hàng/sản phẩm');
    await waitFor(() => expect(screen.queryByTestId('user-moderation-dialog')).not.toBeInTheDocument());
  });

  it('mở khóa tài khoản', async () => {
    mockUnban.mockResolvedValue('Đã mở khóa tài khoản và khôi phục gian hàng/sản phẩm');
    render(<AdminUserPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Mở khóa tài khoản Trần Thị Bình' }));
    await userEvent.click(
      within(screen.getByTestId('user-moderation-dialog')).getByRole('button', { name: 'Mở khóa' })
    );

    expect(mockUnban).toHaveBeenCalledWith('u-2');
    expect(mockBan).not.toHaveBeenCalled();
    expect(showSuccess).toHaveBeenCalledWith('Đã mở khóa tài khoản và khôi phục gian hàng/sản phẩm');
  });

  it('khóa thất bại: báo lỗi và giữ dialog để thử lại', async () => {
    const err = new Error('Bạn không thể khóa chính tài khoản của mình');
    mockBan.mockRejectedValue(err);
    render(<AdminUserPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Khóa tài khoản Nguyễn Văn An' }));
    await userEvent.click(
      within(screen.getByTestId('user-moderation-dialog')).getByRole('button', { name: 'Khóa tài khoản' })
    );

    expect(showError).toHaveBeenCalledWith(err);
    expect(screen.getByTestId('user-moderation-dialog')).toBeInTheDocument();
  });

  it('dòng của admin đang đăng nhập không cho tự khóa', () => {
    render(<AdminUserPage />);

    expect(screen.getByRole('button', { name: 'Khóa tài khoản Quản Trị' })).toBeDisabled();
  });

  it('lỗi tải danh sách: hiện thông báo và nút tải lại', async () => {
    mockQuery(undefined, { isError: true, error: new Error('Network Error') });
    render(<AdminUserPage />);

    expect(screen.getByTestId('admin-user-error')).toHaveTextContent('Network Error');
    expect(screen.queryByTestId('admin-user-table')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('đang lọc mà không có kết quả: thông báo không tìm thấy, ẩn phân trang', async () => {
    mockQuery(result({ items: [], total: 0, totalPages: 0 }));
    render(<AdminUserPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Đã khóa' }));

    expect(screen.getByText('Không tìm thấy người dùng phù hợp')).toBeInTheDocument();
    expect(screen.queryByTestId('user-range')).not.toBeInTheDocument();
  });
});
