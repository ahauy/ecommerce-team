import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import type { ProductListParams } from '@/types/product.types';

/** Catalog công khai thay đổi liên tục (người bán đăng/sửa/ẩn) → tải lại khi vào trang nếu dữ liệu cũ hơn 30s. */
const CATALOG_QUERY_OPTIONS = { staleTime: 30_000, refetchOnMount: true } as const;

export const PRODUCT_KEYS = {
  all: ['products'] as const,
  list: (params: ProductListParams) => ['products', 'list', params] as const,
  /** `viewerId` nằm trong key: đăng nhập/đăng xuất → tải lại để Owner/Admin thấy SP ẩn/bị khoá. */
  detail: (id: string, viewerId: string) => ['products', 'detail', id, viewerId] as const,
};

/** Danh sách SP công khai (giữ dữ liệu trang cũ khi đang tải trang mới). */
export const useProducts = (params: ProductListParams, enabled = true) =>
  useQuery({
    queryKey: PRODUCT_KEYS.list(params),
    queryFn: () => productService.getProducts(params),
    placeholderData: keepPreviousData,
    enabled,
    ...CATALOG_QUERY_OPTIONS,
  });

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
