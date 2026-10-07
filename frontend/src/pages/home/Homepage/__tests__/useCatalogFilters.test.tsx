import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useCatalogFilters, countActiveFilters } from '../hooks/useCatalogFilters';

const makeWrapper =
  (url: string) =>
  ({ children }: { children: ReactNode }) =>
    <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>;

describe('useCatalogFilters', () => {
  it('parses filters from the URL and ignores invalid values', () => {
    const { result } = renderHook(() => useCatalogFilters(), {
      wrapper: makeWrapper('/?q=ao&category=thoi-trang&minPrice=100&maxPrice=abc&rating=9&sort=hack'),
    });

    expect(result.current.filters).toEqual({
      q: 'ao',
      category: 'thoi-trang',
      minPrice: '100',
      maxPrice: '',
      minRating: null,
      sort: 'newest',
    });
  });

  it('counts active filter groups (price range counts once)', () => {
    expect(
      countActiveFilters({ category: 'a', minPrice: '1', maxPrice: '2', minRating: 4 })
    ).toBe(3);
    expect(countActiveFilters({ category: '', minPrice: '', maxPrice: '', minRating: null })).toBe(0);
  });

  it('updates filters and clears them while keeping the search keyword', () => {
    const { result } = renderHook(() => useCatalogFilters(), {
      wrapper: makeWrapper('/?q=ao'),
    });

    act(() => result.current.setFilters({ category: 'giay', minRating: 4 }));
    expect(result.current.filters.category).toBe('giay');
    expect(result.current.filters.minRating).toBe(4);
    expect(result.current.activeCount).toBe(2);

    act(() => result.current.clearFilters());
    expect(result.current.filters.category).toBe('');
    expect(result.current.filters.minRating).toBeNull();
    expect(result.current.filters.q).toBe('ao');
    expect(result.current.activeCount).toBe(0);
  });
});
