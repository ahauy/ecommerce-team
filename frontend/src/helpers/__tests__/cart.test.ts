import { describe, it, expect } from 'vitest';
import { buildCart, getCartStats, getStatusLabel, resolveItemStatus, type CartEntry } from '../cart';

const entry = (over: Partial<CartEntry> & { sellerId?: string; price?: number; stock?: number } = {}): CartEntry => ({
  seller: { id: over.sellerId ?? 's1', shopName: 'Shop 1' },
  product: { id: 'p1', name: 'SP', slug: null, imageUrl: null, price: over.price ?? 100, stock: over.stock ?? 10 },
  quantity: 2,
  status: 'available',
  ...(over.status ? { status: over.status } : {}),
  ...(over.quantity ? { quantity: over.quantity } : {}),
  ...(over.product ? { product: over.product } : {}),
});

describe('resolveItemStatus', () => {
  const base = { stock: 5, quantity: 2, isActive: true, isBlocked: false };

  it('available when active and quantity <= stock', () => {
    expect(resolveItemStatus(base)).toBe('available');
    expect(resolveItemStatus({ ...base, quantity: 5 })).toBe('available');
  });
  it('exceeds_stock when 0 < stock < quantity', () => {
    expect(resolveItemStatus({ ...base, quantity: 6 })).toBe('exceeds_stock');
  });
  it('out_of_stock when stock = 0', () => {
    expect(resolveItemStatus({ ...base, stock: 0 })).toBe('out_of_stock');
  });
  it('unavailable when hidden or blocked (takes priority over stock)', () => {
    expect(resolveItemStatus({ ...base, isActive: false })).toBe('unavailable');
    expect(resolveItemStatus({ ...base, isBlocked: true, stock: 0 })).toBe('unavailable');
  });
});

describe('buildCart', () => {
  it('groups by seller in order of first appearance and only sums available items', () => {
    const cart = buildCart([
      entry({ sellerId: 'a', price: 100 }),
      entry({ sellerId: 'b', price: 50, quantity: 1 }),
      entry({ sellerId: 'a', price: 300, status: 'exceeds_stock' }),
    ]);

    expect(cart.groups.map((g) => g.seller.id)).toEqual(['a', 'b']);
    expect(cart.groups[0].items).toHaveLength(2);
    expect(cart.groups[0].subtotal).toBe(200);
    expect(cart.groups[1].subtotal).toBe(50);
    expect(cart.totalAmount).toBe(250);
    // lineTotal vẫn được tính cho item không mua được
    expect(cart.groups[0].items[1].lineTotal).toBe(600);
  });

  it('returns an empty cart for no entries', () => {
    expect(buildCart([])).toEqual({ groups: [], totalAmount: 0 });
  });
});

describe('getCartStats', () => {
  it('counts products, unavailable items and orders (shops with something purchasable)', () => {
    const cart = buildCart([
      entry({ sellerId: 'a' }),
      entry({ sellerId: 'a', status: 'out_of_stock' }),
      entry({ sellerId: 'b', status: 'unavailable' }),
    ]);
    expect(getCartStats(cart)).toEqual({
      productCount: 3,
      purchasableCount: 1,
      unavailableCount: 2,
      orderCount: 1,
    });
  });
});

describe('getStatusLabel', () => {
  it('matches the API contract wording', () => {
    expect(getStatusLabel('available', 5)).toBeNull();
    expect(getStatusLabel('exceeds_stock', 2)).toBe('Chỉ còn 2 sản phẩm');
    expect(getStatusLabel('out_of_stock', 0)).toBe('Hết hàng');
    expect(getStatusLabel('unavailable', 0)).toBe('Sản phẩm ngừng bán');
  });
});
