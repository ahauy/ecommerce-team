import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/services/apiClient', () => ({ apiClient: { get } }));

import { checkoutResultService, normalizeCheckoutStatus } from '../services/checkout-result.service';

describe('checkout-result.service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('normalizes the minimal API contract', () => {
    const r = normalizeCheckoutStatus({
      checkoutCode: 'CHK-1',
      status: 'paid',
      totalAmount: 59980000,
      orders: [{ orderCode: 'ORD-1', shopName: 'Shop A', totalAmount: 29990000, status: 'confirmed' }],
    });
    expect(r.status).toBe('paid');
    expect(r.orders[0]).toMatchObject({ id: null, orderCode: 'ORD-1', shopName: 'Shop A', status: 'confirmed', items: [] });
  });

  it('falls back to pending for unknown statuses and uses the requested code', () => {
    const r = normalizeCheckoutStatus({ status: 'weird', orders: [{ orderCode: 'O', status: 'nope' }] }, 'CHK-X');
    expect(r.checkoutCode).toBe('CHK-X');
    expect(r.status).toBe('pending');
    expect(r.orders[0].status).toBe('pending');
  });

  it('reads optional id / seller / items when the API provides them', () => {
    const r = normalizeCheckoutStatus({
      orders: [{ orderId: 'o1', orderCode: 'O', seller: { shopName: 'S' }, items: [{ name: 'A', quantity: 2 }, { quantity: 1 }] }],
    });
    expect(r.orders[0].id).toBe('o1');
    expect(r.orders[0].shopName).toBe('S');
    expect(r.orders[0].items).toEqual([{ name: 'A', quantity: 2 }]);
  });

  it('calls GET /checkouts/:code with the code URL-encoded', async () => {
    get.mockResolvedValue({ data: { checkoutCode: 'CHK-1', status: 'pending', orders: [] } });
    const r = await checkoutResultService.getCheckout('CHK 1');
    expect(get).toHaveBeenCalledWith('/checkouts/CHK%201');
    expect(r.status).toBe('pending');
  });
});
