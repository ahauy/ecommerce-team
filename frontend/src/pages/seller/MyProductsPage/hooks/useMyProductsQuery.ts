import { useQuery } from '@tanstack/react-query';
import {
  myProductsService,
  MY_PRODUCTS_QUERY_KEY,
} from '../services/my-products.service';
import { MyProductsQueryParams } from '../types';

export const useMyProductsQuery = (
  params: MyProductsQueryParams = { page: 1, limit: 20 },
  enabled = true
) => {
  return useQuery({
    queryKey: [...MY_PRODUCTS_QUERY_KEY, params.page, params.limit],
    queryFn: () => myProductsService.getMyProducts(params),
    enabled,
  });
};
