import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminCategoryPage from '../index';
import { categoryService } from '@/services/category.service';
import { AdminCategoryItem } from '@/types/category.types';

const { mockUseAdminCategories, mockUseDeleteCategory } = vi.hoisted(() => ({
  mockUseAdminCategories: vi.fn(),
  mockUseDeleteCategory: vi.fn(),
}));

vi.mock('@/services/category.service', () => ({
  categoryService: {
    useAdminCategories: mockUseAdminCategories,
    useDeleteCategory: mockUseDeleteCategory,
    useCreateCategory: vi.fn().mockReturnValue({ mutateAsync: vi.fn(), isPending: false }),
    useUpdateCategory: vi.fn().mockReturnValue({ mutateAsync: vi.fn(), isPending: false }),
  },
}));

vi.mock('@/helpers/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

describe('AdminCategoryPage (Stitch Screen 1 & DESIGN.md)', () => {
  const mockCategories: AdminCategoryItem[] = [
    {
      _id: 'cat-1',
      name: 'Gia dụng',
      slug: 'gia-dung',
      description: 'Đồ gia dụng tiện ích',
      imageUrl: 'https://example.com/gd.jpg',
      isActive: true,
      productCount: 48,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
    },
    {
      _id: 'cat-2',
      name: 'Thời trang',
      slug: 'thoi-trang',
      description: 'Quần áo phụ kiện',
      imageUrl: 'https://example.com/tt.jpg',
      isActive: true,
      productCount: 124,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
    },
    {
      _id: 'cat-3',
      name: 'Thủ công & Quà tặng',
      slug: 'thu-cong-qua-tang',
      description: 'Quà tặng lưu niệm',
      imageUrl: null,
      isActive: false,
      productCount: 0,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDeleteCategory.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it('renders loading state with bento skeleton placeholders', () => {
    mockUseAdminCategories.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<AdminCategoryPage />);
    expect(screen.getByText('Danh mục')).toBeInTheDocument();
    expect(screen.getByTestId('stats-skeleton-total')).toBeInTheDocument();
    expect(screen.getByTestId('stats-skeleton-active')).toBeInTheDocument();
    expect(screen.getByTestId('stats-skeleton-hidden')).toBeInTheDocument();
    expect(screen.getByTestId('stats-skeleton-products')).toBeInTheDocument();
  });

  it('renders error state with retry option', () => {
    const mockRefetch = vi.fn();
    mockUseAdminCategories.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch'),
      refetch: mockRefetch,
    });

    render(<AdminCategoryPage />);
    expect(screen.getByTestId('admin-category-error')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /tải lại/i });
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders empty state when no categories exist', () => {
    mockUseAdminCategories.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    render(<AdminCategoryPage />);
    expect(screen.getByTestId('category-table-empty')).toBeInTheDocument();
    expect(screen.getByText('Chưa có danh mục nào')).toBeInTheDocument();
  });

  it('renders success state with bento stats and category table', () => {
    mockUseAdminCategories.mockReturnValue({
      data: mockCategories,
      isLoading: false,
      isError: false,
    });

    render(<AdminCategoryPage />);

    // Header title
    expect(screen.getByText('Danh mục')).toBeInTheDocument();

    // Stats
    expect(screen.getByText('Tổng số danh mục')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // total 3
    expect(screen.getByText('2')).toBeInTheDocument(); // active 2
    expect(screen.getAllByText('1')[0]).toBeInTheDocument(); // hidden 1
    expect(screen.getByText('172')).toBeInTheDocument(); // products 48 + 124 = 172

    // Table rows
    expect(screen.getByText('Gia dụng')).toBeInTheDocument();
    expect(screen.getByText('Thời trang')).toBeInTheDocument();
    expect(screen.getByText('Thủ công & Quà tặng')).toBeInTheDocument();
  });

  it('filters categories by search input', async () => {
    const user = userEvent.setup();
    mockUseAdminCategories.mockReturnValue({
      data: mockCategories,
      isLoading: false,
      isError: false,
    });

    render(<AdminCategoryPage />);
    const searchInput = screen.getByLabelText(/tìm kiếm danh mục/i);
    expect(searchInput).toHaveAttribute('aria-label', 'Tìm kiếm danh mục theo tên hoặc slug');

    // Search by name
    await user.type(searchInput, 'thời');
    expect(screen.getByText('Thời trang')).toBeInTheDocument();
    expect(screen.queryByText('Gia dụng')).not.toBeInTheDocument();

    // Clear search
    await user.clear(searchInput);
    expect(screen.getByText('Gia dụng')).toBeInTheDocument();

    // Search by slug
    await user.type(searchInput, 'thu-cong');
    expect(screen.getByText('Thủ công & Quà tặng')).toBeInTheDocument();
    expect(screen.queryByText('Thời trang')).not.toBeInTheDocument();
  });

  it('filters categories by status chips and updates aria-pressed', () => {
    mockUseAdminCategories.mockReturnValue({
      data: mockCategories,
      isLoading: false,
      isError: false,
    });

    render(<AdminCategoryPage />);

    const activeFilterBtn = screen.getByRole('button', { name: 'Hoạt động' });
    const hiddenFilterBtn = screen.getByRole('button', { name: 'Đang ẩn' });
    const allFilterBtn = screen.getByRole('button', { name: 'Tất cả' });

    expect(allFilterBtn).toHaveAttribute('aria-pressed', 'true');
    expect(activeFilterBtn).toHaveAttribute('aria-pressed', 'false');
    expect(hiddenFilterBtn).toHaveAttribute('aria-pressed', 'false');

    // Filter Active
    fireEvent.click(activeFilterBtn);
    expect(activeFilterBtn).toHaveAttribute('aria-pressed', 'true');
    expect(allFilterBtn).toHaveAttribute('aria-pressed', 'false');
    expect(hiddenFilterBtn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Gia dụng')).toBeInTheDocument();
    expect(screen.getByText('Thời trang')).toBeInTheDocument();
    expect(screen.queryByText('Thủ công & Quà tặng')).not.toBeInTheDocument();

    // Filter Hidden
    fireEvent.click(hiddenFilterBtn);
    expect(hiddenFilterBtn).toHaveAttribute('aria-pressed', 'true');
    expect(activeFilterBtn).toHaveAttribute('aria-pressed', 'false');
    expect(allFilterBtn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText('Gia dụng')).not.toBeInTheDocument();
    expect(screen.queryByText('Thời trang')).not.toBeInTheDocument();
    expect(screen.getByText('Thủ công & Quà tặng')).toBeInTheDocument();

    // Reset to All
    fireEvent.click(allFilterBtn);
    expect(allFilterBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Gia dụng')).toBeInTheDocument();
    expect(screen.getByText('Thủ công & Quà tặng')).toBeInTheDocument();
  });

  it('opens drawer in create mode on "+ Thêm danh mục" click', () => {
    mockUseAdminCategories.mockReturnValue({
      data: mockCategories,
      isLoading: false,
      isError: false,
    });

    render(<AdminCategoryPage />);
    const addBtn = screen.getByRole('button', { name: /thêm danh mục/i });
    fireEvent.click(addBtn);

    expect(screen.getByTestId('category-form-drawer')).toBeInTheDocument();
    expect(screen.getByText('Thêm danh mục mới')).toBeInTheDocument();
  });

  it('opens drawer in edit mode on table row "Chỉnh sửa" click', () => {
    mockUseAdminCategories.mockReturnValue({
      data: mockCategories,
      isLoading: false,
      isError: false,
    });

    render(<AdminCategoryPage />);
    const editButtons = screen.getAllByRole('button', { name: /chỉnh sửa/i });
    fireEvent.click(editButtons[0]);

    expect(screen.getByTestId('category-form-drawer')).toBeInTheDocument();
    expect(screen.getByText('Chỉnh sửa danh mục')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Gia dụng')).toBeInTheDocument();
  });

  it('opens delete dialog on table row "Xóa" click', () => {
    mockUseAdminCategories.mockReturnValue({
      data: mockCategories,
      isLoading: false,
      isError: false,
    });

    render(<AdminCategoryPage />);
    const deleteButtons = screen.getAllByRole('button', { name: /xóa/i });
    // First category has 48 products -> blocked dialog
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByTestId('delete-warning-dialog')).toBeInTheDocument();
    expect(screen.getByText('Không thể xóa danh mục')).toBeInTheDocument();
  });

  it('enforces DESIGN.md tokens: cream canvas and pill buttons', () => {
    mockUseAdminCategories.mockReturnValue({
      data: mockCategories,
      isLoading: false,
      isError: false,
    });

    render(<AdminCategoryPage />);

    // Cream canvas
    const pageContainer = screen.getByTestId('admin-category-page');
    expect(pageContainer).toHaveClass('bg-[#fbfbf5]');

    // Headline uses brand weight 330
    const headline = screen.getByRole('heading', { level: 1, name: 'Danh mục' });
    expect(headline).toHaveClass('font-[330]');

    // Add button is rounded-full and has min-h-[44px]
    const addBtn = screen.getByRole('button', { name: /thêm danh mục/i });
    expect(addBtn).toHaveClass('rounded-full');
    expect(addBtn).toHaveClass('min-h-[44px]');

    // Status badges use Aloe-10 and shade-30 / shade-70 tokens
    const row1 = screen.getByTestId('category-row-cat-1');
    const activeBadge = within(row1).getByText('Hoạt động');
    expect(activeBadge).toHaveClass('bg-[#c1fbd4]');
    expect(activeBadge).toHaveClass('text-black');

    const row3 = screen.getByTestId('category-row-cat-3');
    const hiddenBadge = within(row3).getByText('Đang ẩn');
    expect(hiddenBadge).toHaveClass('bg-[#d4d4d8]');
    expect(hiddenBadge).toHaveClass('text-[#3f3f46]');
  });
});
