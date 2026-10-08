import { describe, it, expect } from 'vitest';
import {
  describeIssue,
  getCartIssues,
  mergeIssues,
  shortagesToIssues,
  toCheckoutLines,
} from '../checkout';
import type { Cart, CartItem, CartItemStatus } from '@/types/cart.types';

const item = (id: string, quantity: number, status: CartItemStatus, stock = 10): CartItem => ({
  product: { id, name: `SP ${id}`, slug: null, imageUrl: null, price: 100, stock },
  quantity,
  status,
  lineTotal: 100 * quantity,
});

const cart: Cart = {
  groups: [
    { seller: { id: 's1', shopName: 'Shop A' }, items: [item('p1', 1, 'available'), item('p2', 3, 'exceeds_stock', 1)], subtotal: 100 },
    { seller: { id: 's2', shopName: null }, items: [item('p3', 1, 'out_of_stock', 0), item('p4', 1, 'unavailable')], subtotal: 0 },
  ],
  totalAmount: 100,
};

describe('getCartIssues', () => {
  it('lists every non-available item with its shop and remaining stock', () => {
    const issues = getCartIssues(cart);
    expect(issues.map((i) => i.productId)).toEqual(['p2', 'p3', 'p4']);
    expect(issues[0]).toMatchObject({ shopName: 'Shop A', requested: 3, available: 1 });
    expect(issues[1]).toMatchObject({ shopName: 'Gian hàng khác', available: 0 });
    expect(issues[2].available).toBeNull();
  });
});

describe('shortagesToIssues / mergeIssues', () => {
  it('maps BE shortages to issues using the cart to find the shop', () => {
    const issues = shortagesToIssues(cart, [{ productId: 'p1', name: 'SP p1', available: 0, requested: 1 }]);
    expect(issues[0]).toMatchObject({ productId: 'p1', shopName: 'Shop A', available: 0 });
  });

  it('server data wins over cart data for the same product', () => {
    const fromCart = getCartIssues(cart);
    const fromServer = shortagesToIssues(cart, [{ productId: 'p2', name: 'SP p2', available: 0, requested: 3 }]);
    const merged = mergeIssues(fromCart, fromServer);
    expect(merged).toHaveLength(3);
    expect(merged.find((i) => i.productId === 'p2')?.available).toBe(0);
  });
});

describe('describeIssue', () => {
  const base = { productId: 'p', name: 'n', shopName: 's', requested: 2 };
  it('covers short stock, out of stock and discontinued', () => {
    expect(describeIssue({ ...base, available: 1 })).toBe('Bạn yêu cầu 2 sản phẩm, hiện chỉ còn 1 sản phẩm.');
    expect(describeIssue({ ...base, available: 0 })).toBe('Sản phẩm đã hết hàng.');
    expect(describeIssue({ ...base, available: null })).toBe('Sản phẩm đã ngừng bán.');
  });
});

describe('toCheckoutLines', () => {
  it('only sends productId + quantity of available items (never price / sellerId)', () => {
    expect(toCheckoutLines(cart)).toEqual([{ productId: 'p1', quantity: 1 }]);
  });
});
