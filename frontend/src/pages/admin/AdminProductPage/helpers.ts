import { SELLER_BANNED_REASON, type AdminProduct } from './types';

export type AdminProductStatus = 'selling' | 'hidden' | 'blocked' | 'seller_banned';

export const getProductStatus = (product: AdminProduct): AdminProductStatus => {
  if (product.isBlocked) {
    return product.blockReason === SELLER_BANNED_REASON ? 'seller_banned' : 'blocked';
  }
  return product.isActive ? 'selling' : 'hidden';
};

export const isUnblockLocked = (product: AdminProduct): boolean =>
  product.isBlocked && product.blockReason === SELLER_BANNED_REASON && product.seller?.isActive === false;
