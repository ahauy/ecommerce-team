import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { normalizeMyOrder } from '@/helpers/orderHistory';
import { useAuthStore } from '@/stores/auth.store';
import type { MyOrder } from '@/types/order-history.types';

type Raw = Record<string, unknown>;

export const getMyOrderByIdApi = async (id: string): Promise<MyOrder> => {
  const res = await apiClient.get<Raw>(`/orders/my/${id}`);
  return normalizeMyOrder(res.data);
};

export const MY_ORDER_DETAIL_KEYS = {
  detail: (viewerId: string, id: string) => ['my-orders', 'detail', viewerId, id] as const,
};

/** Chi tiết 1 đơn mua. Không retry: 404 là kết quả hợp lệ ("không thấy đơn"). */
export const useMyOrderDetail = (id: string) => {
  const viewerId = useAuthStore((s) => s.user?.id ?? '');
  return useQuery({
    queryKey: MY_ORDER_DETAIL_KEYS.detail(viewerId, id),
    queryFn: () => getMyOrderByIdApi(id),
    enabled: !!viewerId && !!id,
    retry: false,
    staleTime: 10_000,
    refetchOnMount: true,
  });
};

export default useMyOrderDetail;
