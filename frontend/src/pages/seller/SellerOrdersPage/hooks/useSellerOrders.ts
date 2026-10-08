import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { PRODUCT_KEYS } from '@/hooks/queries/useProducts';
import { MY_PRODUCTS_QUERY_KEY } from '../../MyProductsPage/services/my-products.service';
import { SELLER_ORDERS_QUERY_KEY, sellerOrdersService } from '../services/seller-orders.service';
import type { SellerOrder, SellerOrdersParams, UpdateOrderStatusPayload } from '../types';

/** Đơn mới có thể đến bất cứ lúc nào (khách vừa thanh toán) → luôn tải lại khi vào trang. */
const OPTIONS = { staleTime: 10_000, refetchOnMount: true } as const;

/** Danh sách đơn bán (giữ dữ liệu trang cũ khi đang đổi tab / trang). */
export const useSellerOrdersQuery = (params: SellerOrdersParams) => {
  const viewerId = useAuthStore((s) => s.user?.id ?? '');
  return useQuery({
    queryKey: [...SELLER_ORDERS_QUERY_KEY, 'list', viewerId, params],
    queryFn: () => sellerOrdersService.getSellingOrders(params),
    placeholderData: keepPreviousData,
    enabled: !!viewerId,
    ...OPTIONS,
  });
};

/** Chi tiết 1 đơn bán — hiện ngay dữ liệu từ danh sách (`initialOrder`) rồi cập nhật bản mới nhất. */
export const useSellerOrderDetail = (id: string, initialOrder?: SellerOrder | null) => {
  const viewerId = useAuthStore((s) => s.user?.id ?? '');
  return useQuery({
    queryKey: [...SELLER_ORDERS_QUERY_KEY, 'detail', viewerId, id],
    queryFn: () => sellerOrdersService.getSellingOrderById(id),
    placeholderData: initialOrder ?? undefined,
    enabled: !!viewerId && !!id,
    retry: false,
    ...OPTIONS,
  });
};

interface UpdateStatusVariables extends UpdateOrderStatusPayload {
  id: string;
}

/** Đẩy trạng thái đơn. Hủy đơn hoàn kho → làm mới luôn danh sách sản phẩm. */
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: SELLER_ORDERS_QUERY_KEY });
  };

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateStatusVariables) => sellerOrdersService.updateStatus(id, payload),
    onSuccess: (_, variables) => {
      refresh();
      if (variables.status === 'cancelled') {
        queryClient.invalidateQueries({ queryKey: MY_PRODUCTS_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      }
    },
    // Lỗi 400/403/404 thường do trạng thái đơn đã đổi (Admin / khách) → đồng bộ lại cho đúng.
    onError: refresh,
  });
};
