import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Pagination, { buildPageItems } from '../index';

describe('buildPageItems', () => {
  it('lists every page when there are few', () => {
    expect(buildPageItems(1, 4)).toEqual([1, 2, 3, 4]);
  });

  it('collapses the tail with an ellipsis near the start', () => {
    expect(buildPageItems(1, 13)).toEqual([1, 2, 'gap-end', 13]);
  });

  it('collapses both sides in the middle', () => {
    expect(buildPageItems(7, 13)).toEqual([1, 'gap-start', 6, 7, 8, 'gap-end', 13]);
  });

  it('collapses the head near the end', () => {
    expect(buildPageItems(13, 13)).toEqual([1, 'gap-start', 12, 13]);
  });
});

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPageChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('marks the current page and disables "previous" on page 1', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Trang 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Trang sau' })).toBeEnabled();
  });

  it('calls onPageChange for a number, next and previous', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Trang 5' }));
    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }));
    fireEvent.click(screen.getByRole('button', { name: 'Trang trước' }));
    expect(onPageChange.mock.calls.map((c) => c[0])).toEqual([5, 4, 2]);
  });

  it('does not re-fire for the page already shown', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Trang 2' }));
    expect(onPageChange).not.toHaveBeenCalled();
  });
});
