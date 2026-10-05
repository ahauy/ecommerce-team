import { apiClient } from './apiClient';
import { useQuery } from '@tanstack/react-query';

export interface PublicShopResponseDto {
  sellerId: string;
  shopName: string;
  shopSlug: string;
  joinedAt: string;
  productCount: number;
}

const SHOP_KEY = (sellerId: string) => ['shop', 'public', sellerId];

export const shopService = {
  getPublicShop: async (sellerId: string): Promise<PublicShopResponseDto> => {
    const response = await apiClient.get<PublicShopResponseDto>(`/shops/${sellerId}`);
    return response.data;
  },

  useGetPublicShop: (sellerId: string, enabled = true) => {
    return useQuery({
      queryKey: SHOP_KEY(sellerId),
      queryFn: () => shopService.getPublicShop(sellerId),
      enabled: enabled && !!sellerId,
    });
  },
};

export default shopService;