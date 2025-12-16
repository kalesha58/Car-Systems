import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {mmkvStorage} from './storage';

interface SavedItem {
  _id: string | number;
  item: any;
  count: number;
  savedAt: number;
}

interface SavedForLaterStore {
  savedItems: SavedItem[];
  saveItem: (item: any, count?: number) => void;
  removeSavedItem: (id: string | number) => void;
  moveToCart: (id: string | number) => any | null;
  clearSaved: () => void;
  isSaved: (id: string | number) => boolean;
}

const normalizeId = (item: any): string | number => {
  if (typeof item === 'string' || typeof item === 'number') {
    return item;
  }
  return item?._id ?? item?.id;
};

export const useSavedForLaterStore = create<SavedForLaterStore>()(
  persist(
    (set, get) => ({
      savedItems: [],
      saveItem: (item: any, count: number = 1) => {
        const current = get().savedItems;
        const normalizedId = normalizeId(item);
        const existingIndex = current.findIndex(
          saved => normalizeId(saved._id) === normalizedId,
        );

        if (existingIndex >= 0) {
          const updated = [...current];
          updated[existingIndex] = {
            ...updated[existingIndex],
            count: count || updated[existingIndex].count,
            savedAt: Date.now(),
          };
          set({savedItems: updated});
        } else {
          set({
            savedItems: [
              ...current,
              {
                _id: normalizedId,
                item: item,
                count: count || 1,
                savedAt: Date.now(),
              },
            ],
          });
        }
      },
      removeSavedItem: (id: string | number) => {
        const normalizedId = normalizeId(id);
        set({
          savedItems: get().savedItems.filter(
            saved => normalizeId(saved._id) !== normalizedId,
          ),
        });
      },
      moveToCart: (id: string | number) => {
        const normalizedId = normalizeId(id);
        const savedItem = get().savedItems.find(
          saved => normalizeId(saved._id) === normalizedId,
        );
        if (savedItem) {
          get().removeSavedItem(normalizedId);
          return savedItem;
        }
        return null;
      },
      clearSaved: () => set({savedItems: []}),
      isSaved: (id: string | number) => {
        const normalizedId = normalizeId(id);
        return get().savedItems.some(
          saved => normalizeId(saved._id) === normalizedId,
        );
      },
    }),
    {
      name: 'saved-for-later-storage',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

