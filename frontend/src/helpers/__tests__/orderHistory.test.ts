import { describe, expect, it } from 'vitest';
import {
  countUnits,
  formatOrderDate,
  getOrderSteps,
  groupOrdersByCheckout,
  normalizeMyOrder,
  parsePageParam,
  parseTabParam,
} from '../orderHistory';
import type { MyOrder } from '@/types/order-history.types';

const order = (over: Partial<MyOrder> = {}): MyOrder => ({
  id: 'o1',
  orderCode: 'ORD-1',
  checkoutCode: 'CHK-1',
  seller: { id: 's1', shopName: 'Shop A' },
  items: [{ productId: 'p1', name: 'SP', imageUrl: null, price: 1000, quantity: 2 }],
  totalAmount: 2000,
  status: 'confirmed',
  paymentStatus: 'paid',
  paymentMethod: 'payos',
  recipient: null,
  cancelReason: null,
  cancelledBy: null,
  createdAt: '2026-09-15T07:32:00.000Z',
  updatedAt: null,
  ...over,
});

describe('orderHistory helpers', () => {
  it('parses tab and page params defensively', () => {
    expect(parseTabParam('shipping')).toBe('shipping');
    expect(parseTabParam('pending')).toBe('all');
    expect(parseTabParam(null)).toBe('all');
    expect(parsePageParam('3')).toBe(3);
    expect(parsePageParam('0')).toBe(1);
    expect(parsePageParam('abc')).toBe(1);
  });

  it('groups adjacent orders that share a checkoutCode', () => {
    const groups = groupOrdersByCheckout([
      order({ id: 'a', checkoutCode: 'CHK-1' }),
      order({ id: 'b', checkoutCode: 'CHK-1' }),
      order({ id: 'c', checkoutCode: 'CHK-2' }),
      order({ id: 'd', checkoutCode: '' }),
      order({ id: 'e', checkoutCode: '' }),
    ]);
    expect(groups.map((g) => g.orders.map((o) => o.id))).toEqual([['a', 'b'], ['c'], ['d'], ['e']]);
  });

  it('formats an invalid date as empty string', () => {
    expect(formatOrderDate('nope')).toBe('');
    expect(formatOrderDate(null)).toBe('');
  });

  it('counts units across lines', () => {
    expect(countUnits(order())).toBe(2);
  });

  describe('getOrderSteps', () => {
    it('marks confirmed as done and next step as current', () => {
      const steps = getOrderSteps(order({ status: 'confirmed' }));
      expect(steps.map((s) => s.state)).toEqual(['done', 'current', 'upcoming']);
    });

    it('marks every step done when delivered', () => {
      const steps = getOrderSteps(order({ status: 'delivered' }));
      expect(steps.every((s) => s.state === 'done')).toBe(true);
    });

    it('waits on the first step while pending', () => {
      const steps = getOrderSteps(order({ status: 'pending', paymentStatus: 'unpaid' }));
      expect(steps.map((s) => s.state)).toEqual(['current', 'upcoming', 'upcoming']);
    });

    it('shows confirmed + failed cancel step for a paid cancelled order', () => {
      const steps = getOrderSteps(order({ status: 'cancelled', cancelledBy: 'system' }));
      expect(steps.map((s) => s.state)).toEqual(['done', 'failed']);
      expect(steps[1].note).toBe('Đơn hàng đã bị hủy bởi hệ thống');
    });

    it('skips the confirmed step when cancelled before payment', () => {
      const steps = getOrderSteps(order({ status: 'cancelled', paymentStatus: 'unpaid', cancelledBy: 'system' }));
      expect(steps.map((s) => s.key)).toEqual(['cancelled']);
    });

    it('adds a refunded step for refunded orders', () => {
      const steps = getOrderSteps(order({ status: 'refunded', paymentStatus: 'refunded', cancelledBy: 'seller' }));
      expect(steps.map((s) => s.key)).toEqual(['confirmed', 'cancelled', 'refunded']);
    });
  });

  describe('normalizeMyOrder', () => {
    it('normalizes a raw order with fallbacks for missing/invalid fields', () => {
      const o = normalizeMyOrder({
        _id: 'abc',
        orderCode: 'ORD-1',
        sellerShopName: 'Shop A',
        items: [{ name: 'SP', price: 100, quantity: 3 }],
        status: 'weird',
        paymentStatus: 'paid',
        cancelledBy: 'robot',
      });
      expect(o.id).toBe('abc');
      expect(o.seller.shopName).toBe('Shop A');
      expect(o.totalAmount).toBe(300);
      expect(o.status).toBe('pending');
      expect(o.paymentStatus).toBe('paid');
      expect(o.cancelledBy).toBeNull();
      expect(o.recipient).toBeNull();
    });
  });
});
