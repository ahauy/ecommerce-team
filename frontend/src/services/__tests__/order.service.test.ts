import { describe, expect, it } from 'vitest';

import { normalizeCheckoutResult } from '../order.service';

describe('order.service › normalizeCheckoutResult', () => {
  it('reads `paymentUrl` from the POST /orders contract', () => {
    const r = normalizeCheckoutResult({
      checkoutId: 'c1',
      checkoutCode: 'CHK-1',
      totalAmount: 100000,
      expiresAt: '2026-10-08T10:30:00.000Z',
      orders: [{ orderId: 'o1', orderCode: 'ORD-1', seller: { id: 's1', shopName: 'Shop A' }, totalAmount: 100000 }],
      paymentUrl: 'https://pay.payos.vn/web/abc123',
    });
    expect(r.paymentUrl).toBe('https://pay.payos.vn/web/abc123');
    expect(r.checkoutCode).toBe('CHK-1');
    expect(r.orders[0]).toMatchObject({ orderId: 'o1', orderCode: 'ORD-1' });
  });

  it('falls back to an empty string when `paymentUrl` is missing', () => {
    expect(normalizeCheckoutResult({ checkoutCode: 'CHK-1' }).paymentUrl).toBe('');
    expect(normalizeCheckoutResult(null).paymentUrl).toBe('');
  });
});
