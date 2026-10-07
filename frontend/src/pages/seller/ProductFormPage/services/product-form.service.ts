import { apiClient } from '@/services/apiClient';
import {
  CreateProductPayload,
  UpdateProductPayload,
  ProductDetailResponse,
} from '../types';

export const PRODUCT_DETAIL_QUERY_KEY = ['products', 'detail'] as const;

export const productFormService = {
  getProductDetail: async (id: string): Promise<ProductDetailResponse> => {
    const res = await apiClient.get<ProductDetailResponse>(`/products/${id}`);
    return res.data;
  },

  createProduct: async (
    payload: CreateProductPayload
  ): Promise<ProductDetailResponse> => {
    const res = await apiClient.post<ProductDetailResponse>('/products', payload);
    return res.data;
  },

  updateProduct: async (
    id: string,
    payload: UpdateProductPayload
  ): Promise<ProductDetailResponse> => {
    const res = await apiClient.patch<ProductDetailResponse>(
      `/products/${id}`,
      payload
    );
    return res.data;
  },
};
