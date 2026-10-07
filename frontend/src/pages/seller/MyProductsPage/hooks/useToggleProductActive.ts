import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  myProductsService,
  MY_PRODUCTS_QUERY_KEY,
} from '../services/my-products.service';

interface TogglePayload {
  id: string;
  isActive: boolean;
}

export const useToggleProductActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: TogglePayload) =>
      myProductsService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_PRODUCTS_QUERY_KEY });
    },
  });
};
