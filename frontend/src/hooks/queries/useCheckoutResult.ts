import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { checkoutResultService } from '@/services/checkout-result.service';
import { CART_KEYS } from '@/hooks/queries/useCart';
import { MY_ORDER_KEYS } from '@/hooks/queries/useMyOrders';
import { useAuthStore } from '@/stores/auth.store';
import { getHttpStatus } from '@/helpers/format';
import type { CheckoutResult } from '@/types/checkout-result.types';

/** Khoảng poll khi Checkout còn `pending` ("vài giây/lần" — docs/06-api-contract.md). */
export const CHECKOUT_POLL_INTERVAL_MS = 3000;

export const CHECKOUT_RESULT_KEYS = {
  all: ['checkout-result'] as const,
  detail: (viewerId: string, checkoutCode: string) => ['checkout-result', viewerId, checkoutCode] as const,
};

/** Còn `pending` → poll tiếp; đã có kết quả cuối (paid/failed/expired) → dừng. */
export const getCheckoutPollInterval = (data: CheckoutResult | undefined): number | false =>
  data?.status === 'pending' ? CHECKOUT_POLL_INTERVAL_MS : false;

/**
 * Trạng thái 1 lần thanh toán theo `checkoutCode`; tự poll khi còn `pending`.
 * Khi ra kết quả cuối: làm tươi giỏ hàng (paid → BE đã xoá SP đã mua, failed/expired → tồn kho đã hoàn)
 * và danh sách đơn mua.
 */
export const useCheckoutResult = (checkoutCode: string) => {
  const queryClient = useQueryClient();
  const viewerId = useAuthStore((s) => s.user?.id ?? '');

  const query = useQuery({
    queryKey: CHECKOUT_RESULT_KEYS.detail(viewerId, checkoutCode),
    queryFn: () => checkoutResultService.getCheckout(checkoutCode),
    enabled: !!viewerId && !!checkoutCode,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: (q) => getCheckoutPollInterval(q.state.data),
    retry: (failureCount, error) => getHttpStatus(error) !== 404 && failureCount < 2,
  });

  const status = query.data?.status;
  useEffect(() => {
    if (!status || status === 'pending') return;
    void queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
    void queryClient.invalidateQueries({ queryKey: MY_ORDER_KEYS.all });
  }, [status, queryClient]);

  return query;
};
