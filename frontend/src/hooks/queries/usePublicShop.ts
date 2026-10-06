import { useQuery } from '@tanstack/react-query';
import { shopService } from '@/services/shop.service';

export const SHOP_KEY = (sellerId: string) => ['shop', 'public', sellerId];

export const usePublicShop = (sellerId: string, enabled = true) => {
  return useQuery({
    queryKey: SHOP_KEY(sellerId),
    queryFn: () => shopService.getPublicShop(sellerId),
    enabled: enabled && !!sellerId,
  });
};

export default usePublicShop;
