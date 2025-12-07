import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import {mmkvStorage} from './storage';

interface CartItem {
  _id: string | number;
  item: any;
  count: number;
}

interface CartStore {
  cart: CartItem[];
  addItem: (item: any) => void;
  removeItem: (id: string | number) => void;
  clearCart: () => void;
  getItemCount: (id: string | number) => number;
  getTotalPrice: () => number;
}

/**
 * Normalize item ID to handle both id and _id fields
 * @param item - Item object or ID value
 * @returns Normalized ID (string | number)
 */
const normalizeId = (item: any): string | number => {
  if (typeof item === 'string' || typeof item === 'number') {
    return item;
  }
  return item?._id ?? item?.id;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],
      addItem: item => {
        const currentCart = get().cart;
        const normalizedId = normalizeId(item);
        const existingItemIndex = currentCart?.findIndex(
          cartItem => cartItem?._id === normalizedId,
        );
        //WHEN ITEM EXIST
        if (existingItemIndex >= 0) {
          const updatedCart = [...currentCart];
          updatedCart[existingItemIndex] = {
            ...updatedCart[existingItemIndex],
            count: updatedCart[existingItemIndex].count + 1,
          };
          set({cart: updatedCart});
        } else {
          set({
            cart: [...currentCart, {_id: normalizedId, item: item, count: 1}],
          });
        }
      },

      clearCart: () => set({cart: []}),

      removeItem: id => {
        const currentCart = get().cart;
        const normalizedId = normalizeId(id);
        const existingItemIndex = currentCart.findIndex(
          cartItem => cartItem?._id === normalizedId,
        );

        if (existingItemIndex >= 0) {
          const updatedCart = [...currentCart];
          const existingItem = updatedCart[existingItemIndex];

          if (existingItem.count > 1) {
            updatedCart[existingItemIndex] = {
              ...existingItem,
              count: existingItem?.count - 1,
            };
          } else {
            updatedCart.splice(existingItemIndex, 1);
          }

          set({cart: updatedCart});
        }
      },

      getItemCount: id => {
        const normalizedId = normalizeId(id);
        const currentItem = get().cart.find(
          cartItem => cartItem._id === normalizedId,
        );
        return currentItem ? currentItem?.count : 0;
      },

      getTotalPrice: () => {
        return get().cart.reduce(
          (total, cartItem) => total + cartItem.item.price * cartItem.count,
          0,
        );
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
