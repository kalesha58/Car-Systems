import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getJSON, setJSON, StorageKeys } from '@storage/index';

interface WishlistContextValue {
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  isWishlisted: (id: string) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    getJSON<string[]>(StorageKeys.WISHLIST).then(data => {
      if (data) {
        setWishlist(data);
      }
    });
  }, []);

  const toggleWishlist = useCallback((id: string) => {
    setWishlist(prev => {
      const updated = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      void setJSON(StorageKeys.WISHLIST, updated);
      return updated;
    });
  }, []);

  const isWishlisted = useCallback((id: string) => wishlist.includes(id), [wishlist]);

  const value = useMemo(
    () => ({ wishlist, toggleWishlist, isWishlisted }),
    [wishlist, toggleWishlist, isWishlisted],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return ctx;
}
