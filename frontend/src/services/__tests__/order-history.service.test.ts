import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/services/apiClient', () => ({ apiClient: { get } }));

import { normalizeMyOrder, orderHistoryService } from '../order-history.service';

describe('order-history.service', () => {
  beforeEach(() => vi.clearAllMocks());

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

  it('sends only defined params and maps the paginated response', async () => {
    get.mockResolvedValue({
      data: { items: [{ id: '1', orderCode: 'ORD-1', seller: { id: 's', shopName: 'A' } }], total: 21, page: 2, limit: 10, totalPages: 3 },
    });
    const res = await orderHistoryService.getMyOrders({ page: 2, limit: 10, status: 'shipping' });
    expect(get).toHaveBeenCalledWith('/orders/my', { params: { page: 2, limit: 10, status: 'shipping' } });
    expect(res.totalPages).toBe(3);
    expect(res.items[0].seller.shopName).toBe('A');

    await orderHistoryService.getMyOrders({ page: 1 });
    expect(get).toHaveBeenLastCalledWith('/orders/my', { params: { page: 1 } });
  });

  it('accepts a bare array response', async () => {
    get.mockResolvedValue({ data: [{ id: '1' }, { id: '2' }] });
    const res = await orderHistoryService.getMyOrders();
    expect(res.items).toHaveLength(2);
    expect(res.total).toBe(2);
    expect(res.totalPages).toBe(1);
  });

  it('loads one order from /orders/my/:id', async () => {
    get.mockResolvedValue({
      data: { id: 'o9', recipient: { fullName: 'An', phone: '09', address: 'HN' } },
    });
    const o = await orderHistoryService.getMyOrderById('o9');
    expect(get).toHaveBeenCalledWith('/orders/my/o9');
    expect(o.recipient?.fullName).toBe('An');
  });
});
