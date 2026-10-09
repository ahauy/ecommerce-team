import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import UserModerationDialog from '../dialogs/UserModerationDialog';
import type { AdminUser } from '../types';

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

const renderDialog = (props: Partial<React.ComponentProps<typeof UserModerationDialog>> = {}) => {
  const onClose = vi.fn();
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  render(
    <UserModerationDialog
      isOpen
      user={seller}
      action="ban"
      onClose={onClose}
      onConfirm={onConfirm}
      {...props}
    />
  );
  return { onClose, onConfirm };
};

describe('UserModerationDialog', () => {
  it('không mở hoặc chưa chọn user: không render', () => {
    const { container } = render(
      <UserModerationDialog isOpen={false} user={seller} action="ban" onClose={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('khóa: cảnh báo không đăng nhập được và số sản phẩm sẽ bị chặn', () => {
    renderDialog();

    expect(screen.getByRole('heading', { name: 'Khóa tài khoản' })).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    const warning = screen.getByTestId('ban-warning');
    expect(warning).toHaveTextContent('không thể đăng nhập');
    expect(warning).toHaveTextContent('Toàn bộ 7 sản phẩm của gian hàng Shop A sẽ bị chặn khỏi sàn.');
  });

  it('khóa user chưa có sản phẩm: không nhắc chặn sản phẩm', () => {
    renderDialog({ user: { ...seller, shop: null, productCount: 0 } });

    expect(screen.getByTestId('ban-warning')).toHaveTextContent('Người dùng này chưa có sản phẩm nào đang bán.');
  });

  it('mở khóa: giải thích chỉ mở lại sản phẩm bị chặn do khóa tài khoản', () => {
    renderDialog({ action: 'unban', user: { ...seller, isActive: false } });

    expect(screen.getByRole('heading', { name: 'Mở khóa tài khoản' })).toBeInTheDocument();
    expect(screen.getByTestId('unban-info')).toHaveTextContent(
      'Sản phẩm bị quản trị viên chặn vì vi phạm vẫn giữ nguyên trạng thái.'
    );
    expect(screen.queryByTestId('ban-warning')).not.toBeInTheDocument();
  });

  it('bấm xác nhận gọi onConfirm với user', async () => {
    const { onConfirm } = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Khóa tài khoản' }));

    expect(onConfirm).toHaveBeenCalledWith(seller);
  });

  it('bấm Hủy hoặc nút đóng gọi onClose', async () => {
    const { onClose } = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    await userEvent.click(screen.getByRole('button', { name: 'Đóng hộp thoại' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('đang xử lý: khóa mọi nút, không cho đóng', async () => {
    const { onClose, onConfirm } = renderDialog({ isSubmitting: true });

    expect(screen.getByRole('button', { name: 'Đang xử lý...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Hủy' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Đóng hộp thoại' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
