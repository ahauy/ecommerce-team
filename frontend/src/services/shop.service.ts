import { apiClient } from '@/services/apiClient';
import { PublicShopResponseDto } from '@/types/shop.types';

export const shopService = {
  getPublicShop: async (sellerId: string): Promise<PublicShopResponseDto> => {
    const response = await apiClient.get<PublicShopResponseDto>(`/shops/${sellerId}`);
    return response.data;
  },
};

export default shopService;
