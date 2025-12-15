import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {mmkvStorage} from './storage';

interface FavoritesStore {
  favorites: string[];
  addFavorite: (itemId: string) => void;
  removeFavorite: (itemId: string) => void;
  isFavorite: (itemId: string) => boolean;
  toggleFavorite: (itemId: string) => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (itemId: string) => {
        const current = get().favorites;
        if (!current.includes(itemId)) {
          set({favorites: [...current, itemId]});
        }
      },
      removeFavorite: (itemId: string) => {
        set({favorites: get().favorites.filter(id => id !== itemId)});
      },
      isFavorite: (itemId: string) => {
        return get().favorites.includes(itemId);
      },
      toggleFavorite: (itemId: string) => {
        const current = get().favorites;
        if (current.includes(itemId)) {
          get().removeFavorite(itemId);
        } else {
          get().addFavorite(itemId);
        }
      },
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

