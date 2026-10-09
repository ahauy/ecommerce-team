import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserModerationDialog from '@/pages/admin/AdminUserPage/dialogs/UserModerationDialog';
import DeleteWarningDialog from '@/pages/admin/AdminCategoryPage/dialogs/DeleteWarningDialog';
import { DeleteProductDialog } from '@/pages/seller/MyProductsPage/dialogs/DeleteProductDialog';
import type { AdminUser } from '@/pages/admin/AdminUserPage/types';
import type { AdminCategoryItem } from '@/types/category.types';
import type { OwnerProduct } from '@/pages/seller/MyProductsPage/types';

const expectCentered = (element: HTMLElement) => {
  expect(element).toHaveClass('fixed', 'left-[50%]', 'top-[50%]');
  expect(element).not.toHaveClass('relative');
};

describe('Dialog luôn cố định giữa màn hình (className tùy chỉnh không được ghi đè "fixed")', () => {
  it('UserModerationDialog', () => {
    const user: AdminUser = {
      id: 'u-1',
      email: 'a@example.com',
      fullName: 'A',
      phone: null,
      role: 'customer',
      isActive: true,
      shop: null,
      productCount: 0,
      createdAt: '2026-10-01T00:00:00.000Z',
    };
    render(<UserModerationDialog isOpen user={user} action="ban" onClose={vi.fn()} onConfirm={vi.fn()} />);

    expectCentered(screen.getByTestId('user-moderation-dialog'));
  });

  it('DeleteWarningDialog', () => {
    const category = {
      _id: 'c-1',
      name: 'Gia dụng',
      slug: 'gia-dung',
      description: '',
      imageUrl: null,
      isActive: true,
      productCount: 0,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
    } as AdminCategoryItem;
    render(<DeleteWarningDialog isOpen category={category} onClose={vi.fn()} onConfirmDelete={vi.fn()} />);

    expectCentered(screen.getByTestId('delete-warning-dialog'));
  });

  it('DeleteProductDialog', () => {
    const product = { id: 'p-1', name: 'Áo thun' } as unknown as OwnerProduct;
    render(<DeleteProductDialog isOpen product={product} onClose={vi.fn()} onConfirm={vi.fn()} />);

    expectCentered(screen.getByTestId('delete-product-dialog'));
  });
});
