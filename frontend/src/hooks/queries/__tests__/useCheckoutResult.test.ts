import { createElement, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getCheckout } = vi.hoisted(() => ({ getCheckout: vi.fn() }));
vi.mock('@/services/checkout-result.service', () => ({ checkoutResultService: { getCheckout } }));

import { useAuthStore } from '@/stores/auth.store';
import {
  CHECKOUT_POLL_INTERVAL_MS,
  getCheckoutPollInterval,
  useCheckoutResult,
} from '../useCheckoutResult';
import type { CheckoutResult } from '@/types/checkout-result.types';

const result = (status: CheckoutResult['status']): CheckoutResult => ({
  checkoutCode: 'CHK-1',
  status,
  totalAmount: 0,
  orders: [],
});

describe('getCheckoutPollInterval', () => {
  it('keeps polling while pending', () => {
    expect(getCheckoutPollInterval(result('pending'))).toBe(CHECKOUT_POLL_INTERVAL_MS);
  });

  it.each(['paid', 'failed', 'expired'] as const)('stops polling once %s', (status) => {
    expect(getCheckoutPollInterval(result(status))).toBe(false);
  });

  it('does not poll before the first response', () => {
    expect(getCheckoutPollInterval(undefined)).toBe(false);
  });
});

describe('useCheckoutResult', () => {
  const setup = (code = 'CHK-1') => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: PropsWithChildren) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    const hook = renderHook(() => useCheckoutResult(code), { wrapper });
    return { invalidate, ...hook };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setSession({ id: 'u1', email: 'a@x.vn', fullName: 'An', role: 'customer' }, 'token');
  });

  it('refreshes the cart and the order history once the checkout has a final status', async () => {
    getCheckout.mockResolvedValue(result('paid'));
    const { invalidate } = setup();
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(2));
    const keys = invalidate.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey[0]);
    expect(keys).toEqual(expect.arrayContaining(['cart', 'my-orders']));
  });

  it('does not touch the cart while the checkout is still pending', async () => {
    getCheckout.mockResolvedValue(result('pending'));
    const { invalidate, result: hook } = setup();
    await waitFor(() => expect(hook.current.data?.status).toBe('pending'));
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('does not fetch without a checkoutCode', () => {
    setup('');
    expect(getCheckout).not.toHaveBeenCalled();
  });
});
