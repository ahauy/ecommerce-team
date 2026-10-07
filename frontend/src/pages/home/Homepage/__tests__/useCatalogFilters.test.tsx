import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { useCatalogFilters, countActiveFilters, SORT_PARAMS } from '../hooks/useCatalogFilters';

const makeWrapper =
  (url: string) =>
  ({ children }: { children: ReactNode }) =>
    <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>;

describe('useCatalogFilters', () => {
  it('parses filters from the URL and ignores invalid values', () => {
    const { result } = renderHook(() => useCatalogFilters(), {
      wrapper: makeWrapper('/?q=ao&category=thoi-trang&minPrice=100&maxPrice=abc&sort=hack&page=-3'),
    });

    expect(result.current.filters).toEqual({
      q: 'ao',
      category: 'thoi-trang',
      minPrice: '100',
      maxPrice: '',
      sort: 'newest',
      page: 1,
    });
  });

  it('reads a valid page number', () => {
    const { result } = renderHook(() => useCatalogFilters(), { wrapper: makeWrapper('/?page=3&sort=price_asc') });
    expect(result.current.filters.page).toBe(3);
    expect(result.current.filters.sort).toBe('price_asc');
  });

  it('counts active filter groups (price range counts once)', () => {
    expect(countActiveFilters({ category: 'a', minPrice: '1', maxPrice: '2' })).toBe(2);
    expect(countActiveFilters({ category: '', minPrice: '', maxPrice: '' })).toBe(0);
  });

  it('updates filters and clears them while keeping the search keyword', () => {
    const { result } = renderHook(() => useCatalogFilters(), { wrapper: makeWrapper('/?q=ao') });

    act(() => result.current.setFilters({ category: 'giay', minPrice: '100000' }));
    expect(result.current.filters.category).toBe('giay');
    expect(result.current.filters.minPrice).toBe('100000');
    expect(result.current.activeCount).toBe(2);

    act(() => result.current.clearFilters());
    expect(result.current.filters.category).toBe('');
    expect(result.current.filters.minPrice).toBe('');
    expect(result.current.filters.q).toBe('ao');
    expect(result.current.activeCount).toBe(0);
  });

  it('resets to page 1 when a filter changes, but keeps the page when only the page changes', () => {
    const { result } = renderHook(() => useCatalogFilters(), { wrapper: makeWrapper('/?page=4') });

    act(() => result.current.setFilters({ page: 5 }));
    expect(result.current.filters.page).toBe(5);

    act(() => result.current.setFilters({ sort: 'price_desc' }));
    expect(result.current.filters.page).toBe(1);
    expect(result.current.filters.sort).toBe('price_desc');
  });

  it('maps every sort option to API sortBy/order', () => {
    expect(SORT_PARAMS.newest).toEqual({ sortBy: 'createdAt', order: 'desc' });
    expect(SORT_PARAMS.price_asc).toEqual({ sortBy: 'price', order: 'asc' });
    expect(SORT_PARAMS.price_desc).toEqual({ sortBy: 'price', order: 'desc' });
    expect(SORT_PARAMS.name_asc).toEqual({ sortBy: 'name', order: 'asc' });
  });
});
