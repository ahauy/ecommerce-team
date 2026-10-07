import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CartLine } from '@/types/cart.types';

export const CART_STORAGE_KEY = 'teamshop.guest-cart';

interface CartState {
  /**
   * Giỏ của Guest — chỉ `productId` + `quantity` (BR-CART-001), SP thêm gần nhất nằm đầu.
   * Customer dùng giỏ trong DB (qua API) nên store này được dọn sau khi merge (BR-CART-002).
   */
  items: CartLine[];
  /** Thêm mới (đưa lên đầu) hoặc cộng dồn nếu SP đã có. */
  addItem: (productId: string, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (productId, quantity) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
              ),
            };
          }
          return { items: [{ productId, quantity }, ...state.items] };
        }),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        })),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: CART_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
