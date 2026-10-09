import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

type PageItem = number | 'gap-start' | 'gap-end';

/** 1 … 4 5 6 … 13 — luôn giữ trang đầu, trang cuối và 1 trang mỗi bên trang hiện tại. */
export const buildPageItems = (page: number, totalPages: number): PageItem[] => {
  if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const items: PageItem[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) items.push('gap-start');
  for (let p = start; p <= end; p += 1) items.push(p);
  if (end < totalPages - 1) items.push('gap-end');
  items.push(totalPages);
  return items;
};

const baseBtn =
  'inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium tabular-nums transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black';

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange, className }) => {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Phân trang" className={cn('flex items-center justify-center gap-2', className)}>
      <button
        type="button"
        aria-label="Trang trước"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={cn(
          baseBtn,
          'border-hairline-light bg-white text-zinc-700 hover:border-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-hairline-light'
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {buildPageItems(page, totalPages).map((item) =>
        typeof item === 'number' ? (
          <button
            key={item}
            type="button"
            aria-label={`Trang ${item}`}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => item !== page && onPageChange(item)}
            className={cn(
              baseBtn,
              item === page
                ? 'border-black bg-black text-white'
                : 'border-hairline-light bg-white text-zinc-700 hover:border-black'
            )}
          >
            {item}
          </button>
        ) : (
          <span key={item} aria-hidden="true" className="w-6 text-center text-sm text-zinc-400">
            …
          </span>
        )
      )}

      <button
        type="button"
        aria-label="Trang sau"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={cn(
          baseBtn,
          'border-hairline-light bg-white text-zinc-700 hover:border-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-hairline-light'
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
};

export default Pagination;
