import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CategoryFormDrawer from '../components/CategoryFormDrawer';
import { categoryService } from '@/services/category.service';
import { AdminCategoryItem } from '@/types/category.types';

const { mockUseCreateCategory, mockUseUpdateCategory } = vi.hoisted(() => ({
  mockUseCreateCategory: vi.fn(),
  mockUseUpdateCategory: vi.fn(),
}));

vi.mock('../services/admin-category.service', () => ({
  adminCategoryService: {
    useCreateCategory: mockUseCreateCategory,
    useUpdateCategory: mockUseUpdateCategory,
  },
}));

vi.mock('@/helpers/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

describe('CategoryFormDrawer Component (Stitch Screen 3)', () => {
  const existingCategory: AdminCategoryItem = {
    _id: 'cat-edit-1',
    name: 'Đồ chơi',
    slug: 'do-choi',
    description: 'Các sản phẩm đồ chơi giải trí',
    imageUrl: 'https://example.com/toy.jpg',
    isActive: true,
    productCount: 12,
    createdAt: '2026-10-01',
    updatedAt: '2026-10-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreateCategory.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUseUpdateCategory.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <CategoryFormDrawer
        isOpen={false}
        category={null}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders create mode with empty fields and live auto-slug', async () => {
    const user = userEvent.setup();
    render(
      <CategoryFormDrawer
        isOpen={true}
        category={null}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('Thêm danh mục mới')).toBeInTheDocument();
    const nameInput = screen.getByLabelText(/Tên danh mục \*/i);
    const slugInput = screen.getByLabelText(/Đường dẫn \(slug\)/i);
    const submitBtn = screen.getByRole('button', { name: /tạo danh mục/i });

    expect(submitBtn).toHaveClass('rounded-full');
    expect(slugInput).toBeDisabled();

    // Type Vietnamese name and verify transliteration preview
    await user.type(nameInput, 'Thiết Bị Điện Tử');
    expect(slugInput).toHaveValue('thiet-bi-dien-tu');
  });

  it('renders edit mode with prefilled values and immutable slug', () => {
    render(
      <CategoryFormDrawer
        isOpen={true}
        category={existingCategory}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('Chỉnh sửa danh mục')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Đồ chơi')).toBeInTheDocument();
    expect(screen.getByDisplayValue('do-choi')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Các sản phẩm đồ chơi giải trí')).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /lưu thay đổi/i });
    expect(saveBtn).toHaveClass('rounded-full');
  });

  it('displays validation error when submitting with invalid input', async () => {
    const user = userEvent.setup();
    render(
      <CategoryFormDrawer
        isOpen={true}
        category={null}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /tạo danh mục/i });
    await user.click(submitBtn);

    expect(await screen.findByText('Vui lòng nhập tên danh mục')).toBeInTheDocument();
  });

  it('handles 409 conflict error when category name already exists', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockRejectedValue({
      response: { status: 409, data: { message: 'Tên danh mục đã tồn tại' } },
    });
    mockUseCreateCategory.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    render(
      <CategoryFormDrawer
        isOpen={true}
        category={null}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    const nameInput = screen.getByLabelText(/Tên danh mục \*/i);
    await user.type(nameInput, 'Đồ chơi');

    const submitBtn = screen.getByRole('button', { name: /tạo danh mục/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('category-form-conflict-error')).toBeInTheDocument();
      expect(
        screen.getByText('Tên danh mục đã tồn tại, vui lòng chọn tên khác')
      ).toBeInTheDocument();
    });
  });

  it('closes on Escape key press for keyboard accessibility', () => {
    const onClose = vi.fn();
    render(
      <CategoryFormDrawer
        isOpen={true}
        category={null}
        onClose={onClose}
        onSuccess={vi.fn()}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when clicking backdrop outside drawer content', async () => {
    const onClose = vi.fn();
    render(
      <CategoryFormDrawer
        isOpen={true}
        category={null}
        onClose={onClose}
        onSuccess={vi.fn()}
      />
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    const overlay = document.querySelector('[data-state="open"].fixed.inset-0') || document.body;
    fireEvent.pointerDown(overlay);
    fireEvent.click(overlay);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onClose).toHaveBeenCalled();
  });
});
