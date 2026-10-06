import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DeleteWarningDialog from '../dialogs/DeleteWarningDialog';
import { AdminCategoryItem } from '@/interfaces/category';

describe('DeleteWarningDialog Component (Stitch Screen 2)', () => {
  const blockedCategory: AdminCategoryItem = {
    _id: 'cat-123',
    name: 'Đồ chơi',
    slug: 'do-choi',
    description: 'Các sản phẩm đồ chơi',
    imageUrl: 'https://example.com/toy.jpg',
    isActive: true,
    productCount: 12,
    createdAt: '2026-10-01',
    updatedAt: '2026-10-01',
  };

  const emptyCategory: AdminCategoryItem = {
    _id: 'cat-456',
    name: 'Thủ công & Quà tặng',
    slug: 'thu-cong-qua-tang',
    description: 'Quà tặng',
    imageUrl: null,
    isActive: false,
    productCount: 0,
    createdAt: '2026-10-01',
    updatedAt: '2026-10-01',
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <DeleteWarningDialog
        isOpen={false}
        category={blockedCategory}
        onClose={vi.fn()}
        onConfirmDelete={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders blocked mode when productCount > 0 (Stitch Screen 2)', () => {
    const onClose = vi.fn();
    const onConfirmDelete = vi.fn();

    render(
      <DeleteWarningDialog
        isOpen={true}
        category={blockedCategory}
        onClose={onClose}
        onConfirmDelete={onConfirmDelete}
      />
    );

    // Headline and alert
    expect(screen.getByText('Không thể xóa danh mục')).toBeInTheDocument();
    expect(screen.getByTestId('blocked-delete-alert')).toBeInTheDocument();
    expect(
      screen.getByText(/hiện có 12 sản phẩm đang sử dụng danh mục/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/chuyển hoặc gán lại toàn bộ 12 sản phẩm/i)
    ).toBeInTheDocument();

    // Category info preview
    expect(screen.getByText('Đồ chơi')).toBeInTheDocument();
    expect(screen.getByText('/category/do-choi')).toBeInTheDocument();
    expect(screen.getByText('12 sản phẩm liên kết')).toBeInTheDocument();

    // Single "Đóng" pill button
    const closeBtn = screen.getByRole('button', { name: 'Đóng' });
    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn).toHaveClass('rounded-full');
    expect(screen.queryByRole('button', { name: /xóa vĩnh viễn/i })).not.toBeInTheDocument();

    // Clicking close calls onClose
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
    expect(onConfirmDelete).not.toHaveBeenCalled();
  });

  it('renders confirmation mode when productCount === 0', () => {
    const onClose = vi.fn();
    const onConfirmDelete = vi.fn();

    render(
      <DeleteWarningDialog
        isOpen={true}
        category={emptyCategory}
        onClose={onClose}
        onConfirmDelete={onConfirmDelete}
      />
    );

    expect(screen.getByText('Xác nhận xóa danh mục')).toBeInTheDocument();
    expect(screen.getByTestId('permitted-delete-alert')).toBeInTheDocument();
    expect(screen.getByText('Thủ công & Quà tặng')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: 'Hủy' });
    const deleteBtn = screen.getByRole('button', { name: /xóa vĩnh viễn/i });

    expect(cancelBtn).toHaveClass('rounded-full');
    expect(deleteBtn).toHaveClass('rounded-full');

    fireEvent.click(deleteBtn);
    expect(onConfirmDelete).toHaveBeenCalledWith('cat-456');
  });

  it('closes on Escape key press for keyboard accessibility', () => {
    const onClose = vi.fn();
    render(
      <DeleteWarningDialog
        isOpen={true}
        category={blockedCategory}
        onClose={onClose}
        onConfirmDelete={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when clicking backdrop outside dialog card', () => {
    const onClose = vi.fn();
    render(
      <DeleteWarningDialog
        isOpen={true}
        category={blockedCategory}
        onClose={onClose}
        onConfirmDelete={vi.fn()}
      />
    );

    const backdrop = screen.getByTestId('delete-warning-dialog');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
