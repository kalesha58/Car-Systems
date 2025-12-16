import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import {mmkvStorage} from './storage';

interface CartItem {
  _id: string | number;
  item: any;
  count: number;
  maxStock?: number;
  stock?: number;
}

import {ICoupon} from '@types/coupon/ICoupon';

interface CartStore {
  cart: CartItem[];
  selectedCoupon: ICoupon | null;
  addItem: (item: any, quantity?: number) => boolean;
  removeItem: (id: string | number) => void;
  clearCart: () => void;
  getItemCount: (id: string | number) => number;
  getTotalPrice: () => number;
  setSelectedCoupon: (coupon: ICoupon | null) => void;
  getCouponDiscount: (subtotal: number) => number;
  updateItemStock: (id: string | number, stock: number) => void;
  getCartByDealer: () => Record<string, CartItem[]>;
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
      addItem: (item, quantity = 1) => {
        const currentCart = get().cart;
        const normalizedId = normalizeId(item);
        const existingItemIndex = currentCart?.findIndex(
          cartItem => cartItem?._id === normalizedId,
        );
        const stock = item?.stock ?? item?.maxStock ?? 999;
        
        //WHEN ITEM EXIST
        if (existingItemIndex >= 0) {
          const updatedCart = [...currentCart];
          const currentItem = updatedCart[existingItemIndex];
          const newCount = currentItem.count + quantity;
          
          // Check stock limit
          if (newCount > stock) {
            return false; // Cannot add more than stock
          }
          
          updatedCart[existingItemIndex] = {
            ...currentItem,
            count: newCount,
            stock: stock,
            maxStock: stock,
          };
          set({cart: updatedCart});
          return true;
        } else {
          // Check if we can add at least 1
          if (stock === 0) {
            return false; // Out of stock
          }
          
          set({
            cart: [...currentCart, {
              _id: normalizedId,
              item: item,
              count: Math.min(quantity, stock),
              stock: stock,
              maxStock: stock,
            }],
          });
          return true;
        }
      },

      clearCart: () => set({cart: [], selectedCoupon: null}),

      removeItem: id => {
        const currentCart = get().cart;
        const normalizedId = normalizeId(id);
        const existingItemIndex = currentCart.findIndex(
          cartItem => {
            const cartItemId = normalizeId(cartItem?._id);
            const itemId = cartItem?.item?.id ? normalizeId(cartItem.item.id) : null;
            const item_id = cartItem?.item?._id ? normalizeId(cartItem.item._id) : null;
            return cartItemId === normalizedId || 
                   cartItemId?.toString() === normalizedId?.toString() ||
                   (itemId && itemId === normalizedId) ||
                   (itemId && itemId?.toString() === normalizedId?.toString()) ||
                   (item_id && item_id === normalizedId) ||
                   (item_id && item_id?.toString() === normalizedId?.toString());
          },
        );

        if (existingItemIndex >= 0) {
          const updatedCart = [...currentCart];
          const existingItem = updatedCart[existingItemIndex];

          // Decrease count by 1
          const newCount = existingItem.count - 1;
          
          if (newCount > 0) {
            // Update count if still greater than 0
            updatedCart[existingItemIndex] = {
              ...existingItem,
              count: newCount,
            };
          } else {
            // Remove item completely if count reaches 0
            updatedCart.splice(existingItemIndex, 1);
          }

          set({cart: updatedCart});
          return true;
        }
        return false;
      },

      getItemCount: id => {
        const normalizedId = normalizeId(id);
        const currentItem = get().cart.find(
          cartItem => {
            const cartItemId = normalizeId(cartItem?._id);
            return cartItemId === normalizedId || 
                   cartItemId?.toString() === normalizedId?.toString() ||
                   (cartItem?.item?.id && normalizeId(cartItem.item.id) === normalizedId) ||
                   (cartItem?.item?._id && normalizeId(cartItem.item._id) === normalizedId);
          },
        );
        return currentItem ? currentItem?.count : 0;
      },

      getTotalPrice: () => {
        return get().cart.reduce(
          (total, cartItem) => total + cartItem.item.price * cartItem.count,
          0,
        );
      },
      updateItemStock: (id: string | number, stock: number) => {
        const normalizedId = normalizeId(id);
        const currentCart = get().cart;
        const itemIndex = currentCart.findIndex(
          cartItem => normalizeId(cartItem._id) === normalizedId,
        );
        if (itemIndex >= 0) {
          const updatedCart = [...currentCart];
          updatedCart[itemIndex] = {
            ...updatedCart[itemIndex],
            stock: stock,
            maxStock: stock,
            count: Math.min(updatedCart[itemIndex].count, stock), // Adjust count if exceeds stock
          };
          set({cart: updatedCart});
        }
      },
      getCartByDealer: () => {
        const cart = get().cart;
        const grouped: Record<string, CartItem[]> = {};
        cart.forEach(item => {
          const dealerId = item.item?.dealerId || item.item?.dealer?._id || 'unknown';
          if (!grouped[dealerId]) {
            grouped[dealerId] = [];
          }
          grouped[dealerId].push(item);
        });
        return grouped;
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
