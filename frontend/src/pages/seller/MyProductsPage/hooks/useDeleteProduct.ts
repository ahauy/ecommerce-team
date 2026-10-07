import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  myProductsService,
  MY_PRODUCTS_QUERY_KEY,
} from '../services/my-products.service';

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => myProductsService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_PRODUCTS_QUERY_KEY });
    },
  });
};
