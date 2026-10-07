import { apiClient } from '@/services/apiClient';
import {
  OwnerProduct,
  MyProductsPaginationResponse,
  MyProductsQueryParams,
} from '../types';

export const MY_PRODUCTS_QUERY_KEY = ['seller', 'products', 'mine'] as const;

export const myProductsService = {
  getMyProducts: async (
    params: MyProductsQueryParams = { page: 1, limit: 20 }
  ): Promise<MyProductsPaginationResponse> => {
    const res = await apiClient.get<MyProductsPaginationResponse>('/products/my', {
      params,
    });
    return res.data;
  },

  toggleActive: async (id: string, isActive: boolean): Promise<OwnerProduct> => {
    const res = await apiClient.patch<OwnerProduct>(`/products/${id}`, {
      isActive,
    });
    return res.data;
  },

  deleteProduct: async (id: string): Promise<{ id: string; isActive: false }> => {
    const res = await apiClient.delete<{ id: string; isActive: false }>(
      `/products/${id}`
    );
    return res.data;
  },
};
