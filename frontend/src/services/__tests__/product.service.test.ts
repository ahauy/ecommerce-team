import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));
vi.mock('@/services/apiClient', () => ({ apiClient: { get: mockGet, patch: vi.fn() } }));

import { productService, normalizeProductSummary } from '../product.service';

describe('normalizeProductSummary', () => {
  it('reads nested seller and first image', () => {
    expect(
      normalizeProductSummary({
        id: 'p1',
        name: 'A',
        slug: 'a-1',
        price: 100,
        stock: 2,
        images: ['u1', 'u2'],
        seller: { id: 's1', shopName: 'Shop 1' },
      })
    ).toEqual({
      id: 'p1',
      name: 'A',
      slug: 'a-1',
      price: 100,
      stock: 2,
      imageUrl: 'u1',
      sellerId: 's1',
      shopName: 'Shop 1',
    });
  });

  it('accepts Mongo _id and a flat sellerId, and tolerates missing fields', () => {
    const out = normalizeProductSummary({ _id: 'x', name: 'B', price: 5, sellerId: 's9' });
    expect(out.id).toBe('x');
    expect(out.sellerId).toBe('s9');
    expect(out.shopName).toBeNull();
    expect(out.imageUrl).toBeNull();
    expect(out.stock).toBe(0);
  });

  it('accepts a populated sellerId object', () => {
    const out = normalizeProductSummary({ id: 'x', name: 'B', price: 5, sellerId: { _id: 's2', shopName: 'S2' } });
    expect(out.sellerId).toBe('s2');
    expect(out.shopName).toBe('S2');
  });
});

describe('productService.getProducts', () => {
  beforeEach(() => mockGet.mockReset());

  it('drops empty params and normalizes the paginated response', async () => {
    mockGet.mockResolvedValue({
      data: { items: [{ id: 'p1', name: 'A', price: 1, stock: 1 }], total: 25, page: 2, limit: 12, totalPages: 3 },
    });

    const res = await productService.getProducts({ page: 2, limit: 12, search: '', categoryId: undefined, minPrice: 0 });

    expect(mockGet).toHaveBeenCalledWith('/products', { params: { page: 2, limit: 12, minPrice: 0 } });
    expect(res.total).toBe(25);
    expect(res.totalPages).toBe(3);
    expect(res.items[0].id).toBe('p1');
  });
});

describe('productService.getProductById', () => {
  it('normalizes detail, defaulting isBlocked/blockReason for public viewers', async () => {
    mockGet.mockResolvedValue({
      data: {
        id: 'p1',
        name: 'A',
        description: 'mô tả',
        price: 10,
        stock: 3,
        images: ['u1'],
        category: { id: 'c1', name: 'Điện thoại' },
        seller: { id: 's1', shopName: 'Shop 1' },
        isActive: true,
      },
    });

    const p = await productService.getProductById('p1');
    expect(p.isBlocked).toBe(false);
    expect(p.blockReason).toBeNull();
    expect(p.category).toEqual({ id: 'c1', name: 'Điện thoại', slug: null });
    expect(p.seller).toEqual({ id: 's1', shopName: 'Shop 1' });
  });
});
