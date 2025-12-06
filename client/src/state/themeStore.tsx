import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {mmkvStorage} from './storage';

export type ThemeMode = 'light' | 'dark';

interface IThemeStore {
  themeMode: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<IThemeStore>()(
  persist(
    (set, get) => ({
      themeMode: 'light',
      setTheme: (theme: ThemeMode) => {
        set({themeMode: theme});
      },
      toggleTheme: () => {
        const currentTheme = get().themeMode;
        set({themeMode: currentTheme === 'light' ? 'dark' : 'light'});
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

