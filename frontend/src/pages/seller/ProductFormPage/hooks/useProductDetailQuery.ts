import { useQuery } from '@tanstack/react-query';
import {
  productFormService,
  PRODUCT_DETAIL_QUERY_KEY,
} from '../services/product-form.service';

export const useProductDetailQuery = (id?: string) => {
  return useQuery({
    queryKey: [...PRODUCT_DETAIL_QUERY_KEY, id],
    queryFn: () => {
      if (!id) throw new Error('Product ID is required');
      return productFormService.getProductDetail(id);
    },
    enabled: Boolean(id),
  });
};
