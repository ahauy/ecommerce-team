import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import BlockProductDialog from '../dialogs/BlockProductDialog';
import UnblockProductDialog from '../dialogs/UnblockProductDialog';
import { BlockReasonSchema, BLOCK_REASON_PRESETS } from '../schemas/block-reason.schema';
import { SELLER_BANNED_REASON, type AdminProduct } from '../types';

const product: AdminProduct = {
  id: 'p-1',
  name: 'Đồng hồ nhái',
  slug: 'dong-ho-nhai',
  price: 500000,
  stock: 3,
  imageUrl: null,
  isActive: true,
  isBlocked: false,
  blockReason: null,
  category: null,
  seller: { id: 'u-1', fullName: 'Người Bán', email: 'seller@example.com', shopName: 'Shop A', isActive: true },
  createdAt: '2026-10-01T00:00:00.000Z',
};

const expectCentered = (element: HTMLElement) => {
  expect(element).toHaveClass('fixed', 'left-[50%]', 'top-[50%]');
  expect(element).not.toHaveClass('relative');
};

describe('BlockProductDialog', () => {
  const renderBlock = (props: Partial<React.ComponentProps<typeof BlockProductDialog>> = {}) => {
    const onClose = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<BlockProductDialog isOpen product={product} onClose={onClose} onConfirm={onConfirm} {...props} />);
    return { onClose, onConfirm };
  };

  it('không mở: không render; mở: nằm giữa màn hình, hiện SP và cảnh báo', () => {
    const { container } = render(
      <BlockProductDialog isOpen={false} product={product} onClose={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();

    renderBlock();
    expectCentered(screen.getByTestId('block-product-dialog'));
    expect(screen.getByText('Đồng hồ nhái')).toBeInTheDocument();
    expect(screen.getByText('Shop A')).toBeInTheDocument();
    expect(screen.getByTestId('block-warning')).toHaveTextContent('biến khỏi trang công khai');
  });

  it('bỏ trống lý do: báo lỗi, không gọi onConfirm', async () => {
    const { onConfirm } = renderBlock();

    await userEvent.click(screen.getByRole('button', { name: 'Chặn sản phẩm' }));

    expect(await screen.findByText('Vui lòng nhập lý do chặn sản phẩm')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('lý do quá ngắn: báo lỗi', async () => {
    const { onConfirm } = renderBlock();

    await userEvent.type(screen.getByLabelText(/Lý do chặn/), 'abc');
    await userEvent.click(screen.getByRole('button', { name: 'Chặn sản phẩm' }));

    expect(await screen.findByText('Lý do chặn phải có ít nhất 5 ký tự')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('nhập lý do hợp lệ: gửi lý do đã trim, có bộ đếm ký tự', async () => {
    const { onConfirm } = renderBlock();

    await userEvent.type(screen.getByLabelText(/Lý do chặn/), '  Bán hàng nhái  ');
    expect(screen.getByTestId('reason-counter')).toHaveTextContent('13/500');
    await userEvent.click(screen.getByRole('button', { name: 'Chặn sản phẩm' }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(product, 'Bán hàng nhái'));
  });

  it('bấm lý do gợi ý điền sẵn vào ô lý do', async () => {
    const { onConfirm } = renderBlock();

    await userEvent.click(screen.getByRole('button', { name: BLOCK_REASON_PRESETS[0] }));
    expect(screen.getByLabelText(/Lý do chặn/)).toHaveValue(BLOCK_REASON_PRESETS[0]);

    await userEvent.click(screen.getByRole('button', { name: 'Chặn sản phẩm' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(product, BLOCK_REASON_PRESETS[0]));
  });

  it('đang xử lý: khóa nút, không cho đóng', async () => {
    const { onClose } = renderBlock({ isSubmitting: true });

    expect(screen.getByRole('button', { name: 'Đang xử lý...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Hủy' })).toBeDisabled();
    expect(screen.getByLabelText(/Lý do chặn/)).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('bấm Hủy gọi onClose', async () => {
    const { onClose } = renderBlock();

    await userEvent.click(screen.getByRole('button', { name: 'Hủy' }));

    expect(onClose).toHaveBeenCalled();
  });
});

describe('BlockReasonSchema', () => {
  it('chặn lý do dành riêng cho hệ thống và lý do quá dài', async () => {
    await expect(BlockReasonSchema.validate({ reason: SELLER_BANNED_REASON })).rejects.toThrow(
      'Lý do này dành riêng cho hệ thống, vui lòng nhập lý do khác'
    );
    await expect(BlockReasonSchema.validate({ reason: 'a'.repeat(501) })).rejects.toThrow(
      'Lý do chặn không được vượt quá 500 ký tự'
    );
    await expect(BlockReasonSchema.validate({ reason: 'Hàng giả' })).resolves.toBeTruthy();
  });
});

describe('UnblockProductDialog', () => {
  const blocked: AdminProduct = { ...product, isBlocked: true, blockReason: 'Hàng giả' };

  const renderUnblock = (props: Partial<React.ComponentProps<typeof UnblockProductDialog>> = {}) => {
    const onClose = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<UnblockProductDialog isOpen product={blocked} onClose={onClose} onConfirm={onConfirm} {...props} />);
    return { onClose, onConfirm };
  };

  it('hiện lý do đã chặn, nằm giữa màn hình, xác nhận gọi onConfirm', async () => {
    const { onConfirm } = renderUnblock();

    expectCentered(screen.getByTestId('unblock-product-dialog'));
    expect(screen.getByText('Hàng giả')).toBeInTheDocument();
    expect(screen.getByTestId('unblock-info')).toHaveTextContent('hiển thị lại trên sàn');

    await userEvent.click(screen.getByRole('button', { name: 'Mở chặn' }));
    expect(onConfirm).toHaveBeenCalledWith(blocked);
  });

  it('SP người bán đang ẩn: báo vẫn chưa hiển thị sau khi mở chặn', () => {
    renderUnblock({ product: { ...blocked, isActive: false } });

    expect(screen.getByTestId('unblock-info')).toHaveTextContent('vẫn chưa hiển thị');
  });

  it('chặn do khóa người bán: không hiện chuỗi nội bộ seller_banned', () => {
    renderUnblock({ product: { ...blocked, blockReason: SELLER_BANNED_REASON } });

    expect(screen.getByText('Người bán từng bị khóa tài khoản')).toBeInTheDocument();
    expect(screen.queryByText(SELLER_BANNED_REASON)).not.toBeInTheDocument();
  });

  it('đang xử lý: khóa nút', () => {
    renderUnblock({ isSubmitting: true });

    expect(screen.getByRole('button', { name: 'Đang xử lý...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Hủy' })).toBeDisabled();
  });
});
