import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CategoryNav from '../index';
import { categoryService } from '@/services/category.service';

const { mockUseCategories } = vi.hoisted(() => ({
  mockUseCategories: vi.fn(),
}));

vi.mock('@/services/category.service', () => ({
  categoryService: {
    useCategories: mockUseCategories,
  },
}));

describe('CategoryNav Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state with skeleton pills', () => {
    mockUseCategories.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<CategoryNav />);
    expect(screen.getByTestId('category-nav-loading')).toBeInTheDocument();
  });

  it('renders error state with retry button', () => {
    const mockRefetch = vi.fn();
    mockUseCategories.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    });

    render(<CategoryNav />);
    expect(screen.getByTestId('category-nav-error')).toBeInTheDocument();
    expect(screen.getByText('Không thể tải danh mục.')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /thử lại/i });
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('returns null when category list is empty', () => {
    mockUseCategories.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    const { container } = render(<CategoryNav />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders categories with pill styling and handles selection', () => {
    const mockCategories = [
      { id: '1', name: 'Gia dụng', slug: 'gia-dung', imageUrl: null },
      { id: '2', name: 'Thời trang', slug: 'thoi-trang', imageUrl: null },
    ];
    mockUseCategories.mockReturnValue({
      data: mockCategories,
      isLoading: false,
      isError: false,
    });

    const onSelect = vi.fn();
    render(<CategoryNav selectedSlug="gia-dung" onSelectCategory={onSelect} />);

    // Nav container
    const nav = screen.getByTestId('category-nav');
    expect(nav).toBeInTheDocument();

    // Check All button
    const allBtn = screen.getByRole('button', { name: 'Tất cả' });
    expect(allBtn).toHaveClass('rounded-full');
    expect(allBtn).toHaveClass('min-h-[44px]');
    expect(allBtn).not.toHaveClass('bg-aloe');
    expect(allBtn).toHaveAttribute('aria-pressed', 'false');
    expect(allBtn).not.toHaveAttribute('aria-current');

    // Check Active Gia dung button
    const giaDungBtn = screen.getByRole('button', { name: 'Gia dụng' });
    expect(giaDungBtn).toHaveClass('rounded-full');
    expect(giaDungBtn).toHaveClass('min-h-[44px]');
    expect(giaDungBtn).toHaveClass('bg-aloe');
    expect(giaDungBtn).toHaveAttribute('aria-pressed', 'true');
    expect(giaDungBtn).toHaveAttribute('aria-current', 'page');

    // Check Inactive Thoi trang button
    const thoiTrangBtn = screen.getByRole('button', { name: 'Thời trang' });
    expect(thoiTrangBtn).toHaveClass('rounded-full');
    expect(thoiTrangBtn).toHaveClass('min-h-[44px]');
    expect(thoiTrangBtn).not.toHaveClass('bg-aloe');
    expect(thoiTrangBtn).toHaveAttribute('aria-pressed', 'false');
    expect(thoiTrangBtn).not.toHaveAttribute('aria-current');

    // Click on Thoi trang
    fireEvent.click(thoiTrangBtn);
    expect(onSelect).toHaveBeenCalledWith('thoi-trang');

    // Click on Tất cả
    fireEvent.click(allBtn);
    expect(onSelect).toHaveBeenCalledWith('');
  });
});
