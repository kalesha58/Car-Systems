import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {mmkvStorage} from './storage';

interface CompareItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  type: 'product' | 'vehicle' | 'service';
}

interface CompareStore {
  items: CompareItem[];
  addItem: (item: CompareItem) => void;
  removeItem: (itemId: string) => void;
  clearCompare: () => void;
  isInCompare: (itemId: string) => boolean;
  canAddMore: () => boolean;
}

const MAX_COMPARE_ITEMS = 3;

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item: CompareItem) => {
        const current = get().items;
        if (current.length >= MAX_COMPARE_ITEMS) {
          return; // Can't add more
        }
        if (!current.find(i => i.id === item.id)) {
          set({items: [...current, item]});
        }
      },
      removeItem: (itemId: string) => {
        set({items: get().items.filter(i => i.id !== itemId)});
      },
      clearCompare: () => {
        set({items: []});
      },
      isInCompare: (itemId: string) => {
        return get().items.some(i => i.id === itemId);
      },
      canAddMore: () => {
        return get().items.length < MAX_COMPARE_ITEMS;
      },
    }),
    {
      name: 'compare-storage',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

