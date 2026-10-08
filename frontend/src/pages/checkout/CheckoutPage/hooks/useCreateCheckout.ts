import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { CART_KEYS } from '@/hooks/queries/useCart';
import type { CreateCheckoutPayload } from '@/types/order.types';

/**
 * Tạo Checkout. Thành công thì FE redirect sang PayOS nên không dọn giỏ ở đây
 * (BE chỉ xóa item đã mua khi Checkout `paid` — BR-CHK-007).
 * Thất bại (kể cả thiếu hàng): tồn kho đã đổi → tải lại giỏ cho khớp.
 */
export const useCreateCheckout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCheckoutPayload) => orderService.createCheckout(payload),
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
    },
  });
};

export default useCreateCheckout;
