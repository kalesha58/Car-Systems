import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { Product } from '@data/mockData';
import { getJSON, setJSON, StorageKeys } from '@storage/index';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (product: Product) => void;
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
    (product: Product) => {
      setItems(prev => {
        const existing = prev.find(i => i.product.id === product.id);
        const updated = existing
          ? prev.map(i =>
              i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
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
      const updated = prev.filter(i => i.product.id !== productId);
      void setJSON(StorageKeys.CART, updated);
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems(prev => {
      const updated =
        quantity <= 0
          ? prev.filter(i => i.product.id !== productId)
          : prev.map(i => (i.product.id === productId ? { ...i, quantity } : i));
      void setJSON(StorageKeys.CART, updated);
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    persist([]);
  }, [persist]);

  const isInCart = useCallback(
    (productId: string) => items.some(i => i.product.id === productId),
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
