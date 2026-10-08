import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartService } from '@/services/cart.service';
import { productService } from '@/services/product.service';
import { PRODUCT_KEYS } from '@/hooks/queries/useProducts';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { getHttpStatus } from '@/helpers/format';
import {
  buildCart,
  EMPTY_CART,
  MAX_CART_PRODUCTS,
  resolveItemStatus,
  UNKNOWN_SELLER_ID,
  type CartEntry,
} from '@/helpers/cart';
import type { Cart, CartLine } from '@/types/cart.types';

export const CART_KEYS = {
  all: ['cart'] as const,
  customer: (userId: string) => ['cart', 'customer', userId] as const,
  guest: (signature: string) => ['cart', 'guest', signature] as const,
};

/** Ai đang dùng giỏ: Guest (localStorage) / Customer (DB) / Admin (không có giỏ — BR-AUTH-011). */
export type CartMode = 'booting' | 'guest' | 'customer' | 'admin';

const useCartMode = (): { mode: CartMode; userId: string } => {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  if (status === 'booting') return { mode: 'booting', userId: '' };
  if (status === 'guest' || !user) return { mode: 'guest', userId: '' };
  return { mode: user.role === 'admin' ? 'admin' : 'customer', userId: user.id };
};

/** Giỏ Customer cần tươi: tồn kho / giá / trạng thái SP có thể đổi bất cứ lúc nào. */
const CUSTOMER_CART_OPTIONS = { staleTime: 10_000, refetchOnMount: true } as const;

/**
 * Dựng giỏ Guest ở client: localStorage chỉ có `productId` + `quantity`,
 * nên lấy thông tin hiện tại (giá, tồn kho, trạng thái) từ `GET /products/:id`.
 */
const useGuestCartQuery = (lines: CartLine[], enabled: boolean) => {
  const queryClient = useQueryClient();
  const signature = lines.map((l) => `${l.productId}:${l.quantity}`).join('|');

  return useQuery({
    queryKey: CART_KEYS.guest(signature),
    enabled: enabled && lines.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    refetchOnMount: true,
    queryFn: async (): Promise<Cart> => {
      const entries = await Promise.all(
        lines.map(async ({ productId, quantity }): Promise<CartEntry> => {
          try {
            const p = await queryClient.fetchQuery({
              queryKey: PRODUCT_KEYS.detail(productId, 'guest'),
              queryFn: () => productService.getProductById(productId),
              staleTime: 10_000,
            });
            return {
              seller: { id: p.seller.id || UNKNOWN_SELLER_ID, shopName: p.seller.shopName },
              product: {
                id: p.id,
                name: p.name,
                slug: p.slug,
                imageUrl: p.images[0] ?? null,
                price: p.price,
                stock: p.stock,
              },
              quantity,
              status: resolveItemStatus({
                stock: p.stock,
                quantity,
                isActive: p.isActive,
                isBlocked: p.isBlocked,
              }),
            };
          } catch (error) {
            // 404: SP bị ẩn / bị khoá / đã xoá — Guest không xem được → vẫn giữ trong giỏ để tự xoá.
            if (getHttpStatus(error) !== 404) throw error;
            return {
              seller: { id: UNKNOWN_SELLER_ID, shopName: null },
              product: {
                id: productId,
                name: 'Sản phẩm không còn khả dụng',
                slug: null,
                imageUrl: null,
                price: 0,
                stock: 0,
              },
              quantity,
              status: 'unavailable',
            };
          }
        })
      );
      return buildCart(entries);
    },
  });
};

export const useCart = () => {
  const { mode, userId } = useCartMode();
  const guestLines = useCartStore((s) => s.items);

  const customerQuery = useQuery({
    queryKey: CART_KEYS.customer(userId),
    queryFn: cartService.getCart,
    enabled: mode === 'customer',
    ...CUSTOMER_CART_OPTIONS,
  });
  const guestQuery = useGuestCartQuery(guestLines, mode === 'guest');

  if (mode === 'guest') {
    // Giỏ Guest rỗng: không cần gọi API.
    if (guestLines.length === 0) {
      return { mode, cart: EMPTY_CART, isPending: false, isError: false, refetch: guestQuery.refetch };
    }
    return {
      mode,
      cart: guestQuery.data,
      isPending: guestQuery.isPending,
      isError: guestQuery.isError,
      refetch: guestQuery.refetch,
    };
  }

  if (mode === 'customer') {
    return {
      mode,
      cart: customerQuery.data,
      isPending: customerQuery.isPending,
      isError: customerQuery.isError,
      refetch: customerQuery.refetch,
    };
  }

  // booting / admin: không có giỏ để hiển thị.
  return { mode, cart: undefined, isPending: false, isError: false, refetch: customerQuery.refetch };
};

/** Số SP khác nhau trong giỏ — badge trên Navbar. Admin / đang khởi động → 0. */
export const useCartCount = (): number => {
  const { mode, userId } = useCartMode();
  const guestCount = useCartStore((s) => s.items.length);
  const { data } = useQuery({
    queryKey: CART_KEYS.customer(userId),
    queryFn: cartService.getCart,
    enabled: mode === 'customer',
    ...CUSTOMER_CART_OPTIONS,
    select: (cart) => cart.groups.reduce((sum, g) => sum + g.items.length, 0),
  });

  if (mode === 'guest') return guestCount;
  if (mode === 'customer') return data ?? 0;
  return 0;
};

/** Lỗi nghiệp vụ phía Guest — cùng thông điệp với BE để UI hiển thị thống nhất. */
const assertGuestQuantity = (stock: number, total: number) => {
  if (stock <= 0) throw new Error('Sản phẩm đã hết hàng');
  if (total > stock) throw new Error(`Số lượng vượt quá tồn kho (còn ${stock} sản phẩm)`);
};

/** Mỗi endpoint ghi của BE đều trả toàn bộ giỏ → ghi thẳng vào cache, không cần refetch. */
const useCustomerCartCache = () => {
  const queryClient = useQueryClient();
  const { userId } = useCartMode();
  return {
    set: (cart: Cart) => queryClient.setQueryData(CART_KEYS.customer(userId), cart),
    /** Lỗi 404/409/400: giỏ đã đổi ở nơi khác → tải lại cho khớp. */
    refresh: () => queryClient.invalidateQueries({ queryKey: CART_KEYS.customer(userId) }),
  };
};

const assertCanUseCart = (mode: CartMode) => {
  if (mode === 'booting') throw new Error('Đang tải phiên đăng nhập, vui lòng thử lại sau giây lát');
  if (mode === 'admin') throw new Error('Tài khoản quản trị chỉ kiểm duyệt, không mua hàng');
};

export interface AddToCartVariables {
  productId: string;
  quantity: number;
  /** Tồn kho hiện tại (Guest dùng để validate ở client; Customer do BE validate). */
  stock: number;
}

export const useAddToCart = () => {
  const { mode } = useCartMode();
  const cache = useCustomerCartCache();

  return useMutation({
    mutationFn: async ({ productId, quantity, stock }: AddToCartVariables) => {
      assertCanUseCart(mode);
      if (mode === 'customer') return cartService.addItem(productId, quantity);

      const { items, addItem } = useCartStore.getState();
      const existing = items.find((i) => i.productId === productId);
      if (!existing && items.length >= MAX_CART_PRODUCTS) throw new Error('Giỏ hàng tối đa 100 sản phẩm');
      assertGuestQuantity(stock, (existing?.quantity ?? 0) + quantity);
      addItem(productId, quantity);
      return null;
    },
    onSuccess: (cart) => {
      if (cart) cache.set(cart);
    },
    onError: () => {
      if (mode === 'customer') void cache.refresh();
    },
  });
};

export interface UpdateCartItemVariables {
  productId: string;
  quantity: number;
  stock: number;
}

export const useUpdateCartItem = () => {
  const { mode } = useCartMode();
  const cache = useCustomerCartCache();

  return useMutation({
    mutationFn: async ({ productId, quantity, stock }: UpdateCartItemVariables) => {
      assertCanUseCart(mode);
      if (mode === 'customer') return cartService.updateItem(productId, quantity);

      assertGuestQuantity(stock, quantity);
      useCartStore.getState().setQuantity(productId, quantity);
      return null;
    },
    onSuccess: (cart) => {
      if (cart) cache.set(cart);
    },
    onError: () => {
      if (mode === 'customer') void cache.refresh();
    },
  });
};

export const useRemoveCartItem = () => {
  const { mode } = useCartMode();
  const cache = useCustomerCartCache();

  return useMutation({
    mutationFn: async (productId: string) => {
      assertCanUseCart(mode);
      if (mode === 'customer') return cartService.removeItem(productId);

      useCartStore.getState().removeItem(productId);
      return null;
    },
    onSuccess: (cart) => {
      if (cart) cache.set(cart);
    },
    onError: () => {
      if (mode === 'customer') void cache.refresh();
    },
  });
};
