import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import ProductCard from '../index';
import type { ProductSummary } from '@/types/product.types';

const base: ProductSummary = {
  id: 'p1',
  name: 'Đồng hồ thông minh Minimal',
  slug: 'dong-ho-k3f9',
  price: 1890000,
  stock: 5,
  imageUrl: 'https://res.cloudinary.com/demo/a.jpg',
  sellerId: 's1',
  shopName: 'Lam Phong Tech',
};

const renderCard = (p: Partial<ProductSummary> = {}) =>
  render(
    <MemoryRouter>
      <ProductCard product={{ ...base, ...p }} />
    </MemoryRouter>
  );

describe('ProductCard', () => {
  it('links to the product detail page and shows name, price and shop', () => {
    renderCard();
    expect(screen.getByTestId('product-card')).toHaveAttribute('href', '/products/p1');
    expect(screen.getByText('Đồng hồ thông minh Minimal')).toBeInTheDocument();
    expect(screen.getByText(/1\.890\.000/)).toBeInTheDocument();
    expect(screen.getByText('Lam Phong Tech')).toBeInTheDocument();
    expect(screen.queryByText('Hết hàng')).not.toBeInTheDocument();
  });

  it('shows the "Hết hàng" badge when stock is 0 but stays clickable', () => {
    renderCard({ stock: 0 });
    expect(screen.getByText('Hết hàng')).toBeInTheDocument();
    expect(screen.getByTestId('product-card')).toHaveAttribute('href', '/products/p1');
  });

  it('falls back to a placeholder when there is no image', () => {
    renderCard({ imageUrl: null });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('omits the shop row when the shop name is unknown', () => {
    renderCard({ shopName: null });
    expect(screen.queryByText('Lam Phong Tech')).not.toBeInTheDocument();
  });
});
