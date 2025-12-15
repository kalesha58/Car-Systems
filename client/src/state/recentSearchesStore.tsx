import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {mmkvStorage} from './storage';

interface RecentSearchesStore {
  searches: string[];
  addSearch: (query: string) => void;
  clearSearches: () => void;
  removeSearch: (query: string) => void;
  getRecentSearches: (limit?: number) => string[];
}

const MAX_SEARCHES = 10;

export const useRecentSearchesStore = create<RecentSearchesStore>()(
  persist(
    (set, get) => ({
      searches: [],
      addSearch: (query: string) => {
        const trimmedQuery = query.trim().toLowerCase();
        if (!trimmedQuery) return;

        const current = get().searches;
        // Remove if already exists
        const filtered = current.filter(s => s !== trimmedQuery);
        // Add to beginning
        const updated = [trimmedQuery, ...filtered].slice(0, MAX_SEARCHES);
        set({searches: updated});
      },
      clearSearches: () => {
        set({searches: []});
      },
      removeSearch: (query: string) => {
        set({searches: get().searches.filter(s => s !== query)});
      },
      getRecentSearches: (limit = 5) => {
        return get().searches.slice(0, limit);
      },
    }),
    {
      name: 'recent-searches-storage',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

