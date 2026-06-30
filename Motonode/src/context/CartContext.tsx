import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { IProduct } from '@app-types/product';
import { getProductId } from '@utils/displayMappers';
import { getJSON, setJSON, StorageKeys } from '@storage/index';

interface CartItem {
  product: IProduct;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (product: IProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    getJSON<CartItem[]>(StorageKeys.CART).then(data => {
      if (data) {
        setItems(data);
      }
    });
  }, []);

  const persist = useCallback((updated: CartItem[]) => {
    setItems(updated);
    void setJSON(StorageKeys.CART, updated);
  }, []);

  const addItem = useCallback(
    (product: IProduct) => {
      const productId = getProductId(product);
      setItems(prev => {
        const existing = prev.find(i => getProductId(i.product) === productId);
        const updated = existing
          ? prev.map(i =>
              getProductId(i.product) === productId ? { ...i, quantity: i.quantity + 1 } : i,
            )
          : [...prev, { product, quantity: 1 }];
        void setJSON(StorageKeys.CART, updated);
        return updated;
      });
    },
    [],
  );

  const removeItem = useCallback((productId: string) => {
    setItems(prev => {
      const updated = prev.filter(i => getProductId(i.product) !== productId);
      void setJSON(StorageKeys.CART, updated);
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems(prev => {
      const updated =
        quantity <= 0
          ? prev.filter(i => getProductId(i.product) !== productId)
          : prev.map(i =>
              getProductId(i.product) === productId ? { ...i, quantity } : i,
            );
      void setJSON(StorageKeys.CART, updated);
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    persist([]);
  }, [persist]);

  const isInCart = useCallback(
    (productId: string) => items.some(i => getProductId(i.product) === productId),
    [items],
  );

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const value = useMemo(
    () => ({
      items,
      count,
      total,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isInCart,
    }),
    [items, count, total, addItem, removeItem, updateQuantity, clearCart, isInCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
