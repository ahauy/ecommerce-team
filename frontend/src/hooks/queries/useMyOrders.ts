import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { orderHistoryService } from '@/services/order-history.service';
import { useAuthStore } from '@/stores/auth.store';
import type { MyOrdersParams } from '@/types/order-history.types';

/** Trạng thái đơn đổi theo người bán / thanh toán → luôn tải lại khi vào trang. */
const MY_ORDER_QUERY_OPTIONS = { staleTime: 10_000, refetchOnMount: true } as const;

export const MY_ORDER_KEYS = {
  all: ['my-orders'] as const,
  /** `viewerId` nằm trong key để đổi tài khoản không lộ cache của người khác. */
  list: (viewerId: string, params: MyOrdersParams) => ['my-orders', 'list', viewerId, params] as const,
  detail: (viewerId: string, id: string) => ['my-orders', 'detail', viewerId, id] as const,
};

/** Danh sách đơn mua (giữ dữ liệu trang cũ khi đang tải trang/tab mới). */
export const useMyOrders = (params: MyOrdersParams) => {
  const viewerId = useAuthStore((s) => s.user?.id ?? '');
  return useQuery({
    queryKey: MY_ORDER_KEYS.list(viewerId, params),
    queryFn: () => orderHistoryService.getMyOrders(params),
    placeholderData: keepPreviousData,
    enabled: !!viewerId,
    ...MY_ORDER_QUERY_OPTIONS,
  });
};

/** Chi tiết 1 đơn mua. Không retry: 404 là kết quả hợp lệ ("không thấy đơn"). */
export const useMyOrderDetail = (id: string) => {
  const viewerId = useAuthStore((s) => s.user?.id ?? '');
  return useQuery({
    queryKey: MY_ORDER_KEYS.detail(viewerId, id),
    queryFn: () => orderHistoryService.getMyOrderById(id),
    enabled: !!viewerId && !!id,
    retry: false,
    ...MY_ORDER_QUERY_OPTIONS,
  });
};
