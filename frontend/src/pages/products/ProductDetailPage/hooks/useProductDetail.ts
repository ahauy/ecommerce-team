import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import { PRODUCT_KEYS } from '@/hooks/queries/useProducts';

/** Catalog công khai thay đổi liên tục (người bán đăng/sửa/ẩn) → tải lại khi vào trang nếu dữ liệu cũ hơn 30s. */
const CATALOG_QUERY_OPTIONS = { staleTime: 30_000, refetchOnMount: true } as const;

export const useProductDetail = (id: string, viewerId: string, enabled = true) =>
  useQuery({
    queryKey: PRODUCT_KEYS.detail(id, viewerId),
    queryFn: () => productService.getProductById(id),
    enabled: enabled && !!id,
    retry: false,
    ...CATALOG_QUERY_OPTIONS,
  });

/** Chủ shop bật/tắt hiển thị sản phẩm ngay trên trang chi tiết. */
export const useSetProductActive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      productService.setActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['seller', 'products', 'mine'] });
    },
  });
};

export default useProductDetail;
