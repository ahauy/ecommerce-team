import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  productFormService,
  PRODUCT_DETAIL_QUERY_KEY,
} from '../services/product-form.service';
import { MY_PRODUCTS_QUERY_KEY } from '../../MyProductsPage/services/my-products.service';
import { CreateProductPayload, UpdateProductPayload } from '../types';

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductPayload) =>
      productFormService.createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProductPayload }) =>
      productFormService.updateProduct(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: MY_PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: [...PRODUCT_DETAIL_QUERY_KEY, id] });
    },
  });
};
