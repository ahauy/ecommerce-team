import { beforeEach, describe, it, expect } from 'vitest';
import { CART_STORAGE_KEY, useCartStore } from '../cart.store';

describe('cart store (guest, localStorage)', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartStore.setState({ items: [] });
  });

  it('adds new products to the front (most recent first)', () => {
    const { addItem } = useCartStore.getState();
    addItem('p1', 1);
    addItem('p2', 3);
    expect(useCartStore.getState().items).toEqual([
      { productId: 'p2', quantity: 3 },
      { productId: 'p1', quantity: 1 },
    ]);
  });

  it('accumulates quantity when the product is already in the cart', () => {
    const { addItem } = useCartStore.getState();
    addItem('p1', 1);
    addItem('p1', 2);
    expect(useCartStore.getState().items).toEqual([{ productId: 'p1', quantity: 3 }]);
  });

  it('setQuantity / removeItem / clear', () => {
    const s = useCartStore.getState();
    s.addItem('p1', 1);
    s.addItem('p2', 1);
    s.setQuantity('p1', 4);
    expect(useCartStore.getState().items.find((i) => i.productId === 'p1')?.quantity).toBe(4);
    s.removeItem('p2');
    expect(useCartStore.getState().items).toEqual([{ productId: 'p1', quantity: 4 }]);
    s.clear();
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('persists only productId + quantity to localStorage (BR-CART-001)', () => {
    useCartStore.getState().addItem('p1', 2);
    const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '{}');
    expect(saved.state).toEqual({ items: [{ productId: 'p1', quantity: 2 }] });
  });
});
