import React from 'react';
import { ProductStatusFilter } from '../types';
import { cn } from '@/lib/utils';

interface ProductFilterChipsProps {
  currentFilter: ProductStatusFilter;
  onFilterChange: (filter: ProductStatusFilter) => void;
  counts?: {
    all: number;
    selling: number;
    hidden: number;
    locked: number;
  };
}

export const ProductFilterChips: React.FC<ProductFilterChipsProps> = ({
  currentFilter,
  onFilterChange,
  counts,
}) => {
  const options: Array<{ id: ProductStatusFilter; label: string }> = [
    { id: 'all', label: 'Tất cả' },
    { id: 'selling', label: 'Đang bán' },
    { id: 'hidden', label: 'Đã ẩn' },
    { id: 'locked', label: 'Bị khóa' },
  ];

  return (
    <div
      data-testid="status-filter-group"
      className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none"
    >
      {options.map(({ id, label }) => {
        const isActive = currentFilter === id;
        const count = counts ? counts[id] : undefined;

        return (
          <button
            key={id}
            type="button"
            data-filter={id}
            onClick={() => onFilterChange(id)}
            className={cn(
              'h-8 px-4 rounded-full text-xs whitespace-nowrap transition-colors flex items-center gap-1.5',
              isActive
                ? 'bg-aloe text-black font-semibold shadow-xs'
                : 'bg-white text-zinc-700 border border-hairline-light hover:border-zinc-400 font-medium'
            )}
          >
            <span>{label}</span>
            {count !== undefined && (
              <span
                className={cn(
                  'text-[11px] px-1.5 py-0.2 rounded-full',
                  isActive ? 'bg-black/10 text-black' : 'bg-zinc-100 text-zinc-600'
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
