import React from 'react';
import { categoryService } from '@/services/category.service';
import { CategoryItem } from '@/interfaces/category';

export interface CategoryNavProps {
  selectedSlug?: string;
  onSelectCategory?: (slug: string) => void;
  className?: string;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedSlug = '',
  onSelectCategory,
  className = '',
}) => {
  const { data: categories, isLoading, isError, refetch } = categoryService.useCategories();

  const handleSelect = (slug: string) => {
    onSelectCategory?.(slug);
  };

  if (isLoading) {
    return (
      <div
        data-testid="category-nav-loading"
        className={`flex items-center gap-2 overflow-x-auto py-2 no-scrollbar ${className}`}
        style={{ fontFeatureSettings: '"ss03"' }}
      >
        <div className="min-h-[44px] w-20 rounded-full bg-zinc-200 animate-pulse shrink-0" />
        <div className="min-h-[44px] w-28 rounded-full bg-zinc-200 animate-pulse shrink-0" />
        <div className="min-h-[44px] w-24 rounded-full bg-zinc-200 animate-pulse shrink-0" />
        <div className="min-h-[44px] w-32 rounded-full bg-zinc-200 animate-pulse shrink-0" />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        data-testid="category-nav-error"
        className={`flex items-center gap-3 py-2 text-xs text-red-600 ${className}`}
        style={{ fontFeatureSettings: '"ss03"' }}
      >
        <span>Không thể tải danh mục.</span>
        <button
          type="button"
          onClick={() => refetch()}
          className="min-h-[44px] rounded-full px-4 py-2 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 font-medium inline-flex items-center justify-center transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  const isAllSelected = !selectedSlug;

  return (
    <nav
      data-testid="category-nav"
      aria-label="Danh mục ngành hàng"
      className={`flex items-center gap-2 overflow-x-auto py-2 scroll-smooth ${className}`}
      style={{ fontFeatureSettings: '"ss03"' }}
    >
      <button
        type="button"
        aria-pressed={isAllSelected}
        aria-current={isAllSelected ? 'page' : undefined}
        onClick={() => handleSelect('')}
        className={`shrink-0 min-h-[44px] px-5 rounded-full text-sm font-medium inline-flex items-center justify-center transition-colors ${
          isAllSelected
            ? 'bg-[#c1fbd4] text-black shadow-sm'
            : 'bg-white text-zinc-700 border border-[#e4e4e7] hover:bg-zinc-50 hover:text-black'
        }`}
      >
        Tất cả
      </button>

      {categories.map((cat: CategoryItem) => {
        const isSelected = selectedSlug === cat.slug;
        return (
          <button
            key={cat._id}
            type="button"
            aria-pressed={isSelected}
            aria-current={isSelected ? 'page' : undefined}
            onClick={() => handleSelect(cat.slug)}
            className={`shrink-0 min-h-[44px] px-5 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-colors ${
              isSelected
                ? 'bg-[#c1fbd4] text-black shadow-sm'
                : 'bg-white text-zinc-700 border border-[#e4e4e7] hover:bg-zinc-50 hover:text-black'
            }`}
          >
            {cat.imageUrl && (
              <img
                src={cat.imageUrl}
                alt=""
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
            )}
            <span>{cat.name}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default CategoryNav;
