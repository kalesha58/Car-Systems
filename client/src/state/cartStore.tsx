import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import {mmkvStorage} from './storage';

interface CartItem {
  _id: string | number;
  item: any;
  count: number;
}

import {ICoupon} from '@types/coupon/ICoupon';

interface CartStore {
  cart: CartItem[];
  selectedCoupon: ICoupon | null;
  addItem: (item: any) => void;
  removeItem: (id: string | number) => void;
  clearCart: () => void;
  getItemCount: (id: string | number) => number;
  getTotalPrice: () => number;
  setSelectedCoupon: (coupon: ICoupon | null) => void;
  getCouponDiscount: (subtotal: number) => number;
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
      selectedCoupon: null,
      setSelectedCoupon: (coupon: ICoupon | null) => {
        set({selectedCoupon: coupon});
      },
      getCouponDiscount: (subtotal: number) => {
        const coupon = get().selectedCoupon;
        if (!coupon || !coupon.isActive) {
          return 0;
        }

        // Check if coupon is valid
        const now = new Date();
        const validFrom = new Date(coupon.validFrom);
        const validUntil = new Date(coupon.validUntil);

        if (now < validFrom || now > validUntil) {
          return 0;
        }

        // Check minimum order amount
        if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
          return 0;
        }

        let discount = 0;

        if (coupon.discountType === 'percentage') {
          discount = (subtotal * coupon.discountValue) / 100;
          // Apply max discount limit if specified
          if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
            discount = coupon.maxDiscountAmount;
          }
        } else {
          // Fixed discount
          discount = coupon.discountValue;
        }

        // Don't allow discount to exceed subtotal
        return Math.min(discount, subtotal);
      },
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

      clearCart: () => set({cart: [], selectedCoupon: null}),

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
