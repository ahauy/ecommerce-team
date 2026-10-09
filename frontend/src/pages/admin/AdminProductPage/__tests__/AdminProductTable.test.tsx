import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import AdminProductTable from '../components/AdminProductTable';
import { getProductStatus, isUnblockLocked } from '../helpers';
import { SELLER_BANNED_REASON, type AdminProduct } from '../types';

const seller = { id: 'u-1', fullName: 'Người Bán', email: 'seller@example.com', shopName: 'Shop A', isActive: true };

const selling: AdminProduct = {
  id: 'p-1',
  name: 'Áo thun',
  slug: 'ao-thun',
  price: 100000,
  stock: 5,
  imageUrl: 'https://res.cloudinary.com/demo/a.jpg',
  isActive: true,
  isBlocked: false,
  blockReason: null,
  category: { id: 'c-1', name: 'Thời trang' },
  seller,
  createdAt: '2026-10-01T00:00:00.000Z',
};

const hidden: AdminProduct = { ...selling, id: 'p-2', name: 'Quần jean', isActive: false };

const blocked: AdminProduct = { ...selling, id: 'p-3', name: 'Đồng hồ nhái', isBlocked: true, blockReason: 'Hàng giả' };

const bannedSeller: AdminProduct = {
  ...selling,
  id: 'p-4',
  name: 'Giày thể thao',
  isBlocked: true,
  blockReason: SELLER_BANNED_REASON,
  seller: { ...seller, isActive: false },
  category: null,
  imageUrl: null,
};

const renderTable = (props: Partial<React.ComponentProps<typeof AdminProductTable>> = {}) => {
  const onBlock = vi.fn();
  const onUnblock = vi.fn();
  render(
    <AdminProductTable
      products={[selling, hidden, blocked, bannedSeller]}
      onBlock={onBlock}
      onUnblock={onUnblock}
      {...props}
    />
  );
  return { onBlock, onUnblock };
};

describe('AdminProductTable', () => {
  it('hiển thị sản phẩm, danh mục, người bán, giá, tồn kho; tên mở trang SP ở tab mới', () => {
    renderTable();

    const row = within(screen.getByTestId('product-row-p-1'));
    const link = row.getByRole('link', { name: 'Áo thun' });
    expect(link).toHaveAttribute('href', '/products/p-1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(row.getByText('Thời trang')).toBeInTheDocument();
    expect(row.getByText('Shop A')).toBeInTheDocument();
    expect(row.getByText('seller@example.com')).toBeInTheDocument();
    expect(row.getByText(/100\.000/)).toBeInTheDocument();
    expect(row.getByText('5')).toBeInTheDocument();
  });

  it('badge trạng thái: Đang bán / Người bán ẩn / Bị chặn kèm lý do / Chặn do khóa người bán', () => {
    renderTable();

    expect(within(screen.getByTestId('product-row-p-1')).getByText('Đang bán')).toBeInTheDocument();
    expect(within(screen.getByTestId('product-row-p-2')).getByText('Người bán ẩn')).toBeInTheDocument();

    const blockedRow = within(screen.getByTestId('product-row-p-3'));
    expect(blockedRow.getByText('Bị chặn')).toBeInTheDocument();
    expect(blockedRow.getByText('Hàng giả')).toBeInTheDocument();

    const bannedRow = within(screen.getByTestId('product-row-p-4'));
    expect(bannedRow.getByText('Chặn do khóa người bán')).toBeInTheDocument();
    expect(bannedRow.queryByText(SELLER_BANNED_REASON)).not.toBeInTheDocument();
    expect(bannedRow.getByText('Người bán đang bị khóa')).toBeInTheDocument();
    expect(bannedRow.getByText('Không có danh mục')).toBeInTheDocument();
  });

  it('SP chưa bị chặn (kể cả đang ẩn) có nút Chặn → onBlock', async () => {
    const { onBlock } = renderTable();

    await userEvent.click(screen.getByRole('button', { name: 'Chặn Quần jean' }));

    expect(onBlock).toHaveBeenCalledWith(hidden);
  });

  it('SP bị chặn có nút Mở chặn → onUnblock', async () => {
    const { onUnblock } = renderTable();

    await userEvent.click(screen.getByRole('button', { name: 'Mở chặn Đồng hồ nhái' }));

    expect(onUnblock).toHaveBeenCalledWith(blocked);
  });

  it('SP bị chặn do người bán đang bị khóa: khóa nút Mở chặn kèm giải thích', async () => {
    const { onUnblock } = renderTable();

    const button = screen.getByRole('button', { name: 'Mở chặn Giày thể thao' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', 'Mở khóa tài khoản người bán để mở lại sản phẩm này');

    await userEvent.click(button);
    expect(onUnblock).not.toHaveBeenCalled();
  });

  it('đang tải: skeleton; rỗng: thông báo theo bộ lọc', () => {
    const { unmount } = render(
      <AdminProductTable products={[]} isLoading onBlock={vi.fn()} onUnblock={vi.fn()} />
    );
    expect(screen.getByTestId('product-table-loading')).toBeInTheDocument();
    unmount();

    renderTable({ products: [], hasFilters: true });
    expect(screen.getByText('Không tìm thấy sản phẩm phù hợp')).toBeInTheDocument();
  });
});

describe('helpers', () => {
  it('getProductStatus', () => {
    expect(getProductStatus(selling)).toBe('selling');
    expect(getProductStatus(hidden)).toBe('hidden');
    expect(getProductStatus(blocked)).toBe('blocked');
    expect(getProductStatus(bannedSeller)).toBe('seller_banned');
  });

  it('isUnblockLocked: chỉ khi chặn do khóa người bán và người bán vẫn bị khóa', () => {
    expect(isUnblockLocked(bannedSeller)).toBe(true);
    expect(isUnblockLocked({ ...bannedSeller, seller: { ...seller, isActive: true } })).toBe(false);
    expect(isUnblockLocked(blocked)).toBe(false);
    expect(isUnblockLocked(selling)).toBe(false);
  });
});
