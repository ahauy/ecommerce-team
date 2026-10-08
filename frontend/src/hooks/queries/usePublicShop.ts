import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { PublicShopResponseDto } from '@/types/shop.types';

export const SHOP_KEY = (sellerId: string) => ['shop', 'public', sellerId] as const;

export const usePublicShop = (sellerId: string, enabled = true) => {
  return useQuery({
    queryKey: SHOP_KEY(sellerId),
    queryFn: () => apiClient.get<PublicShopResponseDto>(`/shops/${sellerId}`).then((r) => r.data),
    enabled: enabled && !!sellerId,
  });
};

export default usePublicShop;
