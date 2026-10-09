import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import AdminUserTable from '../components/AdminUserTable';
import { formatJoinDate, getInitials } from '../helpers';
import type { AdminUser } from '../types';

const seller: AdminUser = {
  id: 'u-1',
  email: 'seller@example.com',
  fullName: 'Nguyễn Văn An',
  phone: '0901234567',
  role: 'customer',
  isActive: true,
  shop: { shopName: 'Shop A', shopSlug: 'shop-a' },
  productCount: 7,
  createdAt: '2026-10-01T03:00:00.000Z',
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

const admin: AdminUser = {
  ...seller,
  id: 'admin-1',
  email: 'admin@example.com',
  fullName: 'Quản Trị',
  role: 'admin',
  shop: null,
};

const renderTable = (props: Partial<React.ComponentProps<typeof AdminUserTable>> = {}) => {
  const onBan = vi.fn();
  const onUnban = vi.fn();
  render(
    <AdminUserTable
      users={[seller, banned, admin]}
      currentUserId="admin-1"
      onBan={onBan}
      onUnban={onUnban}
      {...props}
    />
  );
  return { onBan, onUnban };
};

describe('AdminUserTable', () => {
  it('hiển thị thông tin từng user: tên, email, vai trò, gian hàng, ngày tham gia, trạng thái', () => {
    renderTable();

    const row = within(screen.getByTestId('user-row-u-1'));
    expect(row.getByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(row.getByText('seller@example.com')).toBeInTheDocument();
    expect(row.getByText('Khách hàng')).toBeInTheDocument();
    expect(row.getByText('Shop A')).toBeInTheDocument();
    expect(row.getByText('7 sản phẩm')).toBeInTheDocument();
    expect(row.getByText('01/10/2026')).toBeInTheDocument();
    expect(row.getByText('Hoạt động')).toBeInTheDocument();
    expect(row.getByText('NA')).toBeInTheDocument();

    const bannedRow = within(screen.getByTestId('user-row-u-2'));
    expect(bannedRow.getByText('Chưa có gian hàng')).toBeInTheDocument();
    expect(bannedRow.getByText('Đã khóa')).toBeInTheDocument();

    expect(within(screen.getByTestId('user-row-admin-1')).getByText('Quản trị viên')).toBeInTheDocument();
  });

  it('user đang hoạt động có nút Khóa, bấm gọi onBan', async () => {
    const { onBan } = renderTable();

    await userEvent.click(screen.getByRole('button', { name: 'Khóa tài khoản Nguyễn Văn An' }));

    expect(onBan).toHaveBeenCalledWith(seller);
  });

  it('user bị khóa có nút Mở khóa, bấm gọi onUnban', async () => {
    const { onUnban } = renderTable();

    await userEvent.click(screen.getByRole('button', { name: 'Mở khóa tài khoản Trần Thị Bình' }));

    expect(onUnban).toHaveBeenCalledWith(banned);
  });

  it('dòng của chính admin đang đăng nhập: gắn nhãn (Bạn) và không cho tự khóa', async () => {
    const { onBan } = renderTable();

    const selfRow = within(screen.getByTestId('user-row-admin-1'));
    expect(selfRow.getByText('(Bạn)')).toBeInTheDocument();
    const button = selfRow.getByRole('button', { name: 'Khóa tài khoản Quản Trị' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', 'Bạn không thể khóa chính tài khoản của mình');

    await userEvent.click(button);
    expect(onBan).not.toHaveBeenCalled();
  });

  it('đang tải: hiện skeleton, không hiện bảng', () => {
    renderTable({ isLoading: true });

    expect(screen.getByTestId('user-table-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-user-table')).not.toBeInTheDocument();
  });

  it('danh sách rỗng: thông báo khác nhau khi có / không có bộ lọc', () => {
    const { unmount } = render(
      <AdminUserTable users={[]} currentUserId={null} onBan={vi.fn()} onUnban={vi.fn()} />
    );
    expect(screen.getByText('Chưa có người dùng nào')).toBeInTheDocument();
    unmount();

    renderTable({ users: [], hasFilters: true });
    expect(screen.getByText('Không tìm thấy người dùng phù hợp')).toBeInTheDocument();
  });
});

describe('helpers', () => {
  it('getInitials: chữ đầu của từ đầu và từ cuối, fallback email', () => {
    expect(getInitials('Nguyễn Văn An', 'a@x.com')).toBe('NA');
    expect(getInitials('Bình', 'b@x.com')).toBe('BÌ');
    expect(getInitials('   ', 'c@x.com')).toBe('C');
  });

  it('formatJoinDate: dd/mm/yyyy theo giờ Việt Nam, ngày lỗi hiện —', () => {
    expect(formatJoinDate('2026-09-30T18:00:00.000Z')).toBe('01/10/2026');
    expect(formatJoinDate('')).toBe('—');
  });
});
