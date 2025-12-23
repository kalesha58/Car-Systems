import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {Appearance, ColorSchemeName} from 'react-native';
import {mmkvStorage} from './storage';

export type ThemeMode = 'light' | 'dark';

interface IThemeStore {
  themeMode: ThemeMode;
  isManualOverride: boolean; // Track if user manually set theme
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  syncWithDeviceTheme: () => void;
  initializeTheme: () => void;
}

// Get device theme
const getDeviceTheme = (): ThemeMode => {
  const colorScheme = Appearance.getColorScheme();
  // Default to 'light' if colorScheme is null or undefined
  return colorScheme === 'dark' ? 'dark' : 'light';
};

export const useThemeStore = create<IThemeStore>()(
  persist(
    (set, get) => ({
      themeMode: getDeviceTheme(), // Initialize with device theme
      isManualOverride: false,
      setTheme: (theme: ThemeMode) => {
        set({themeMode: theme, isManualOverride: true});
      },
      toggleTheme: () => {
        const currentTheme = get().themeMode;
        set({themeMode: currentTheme === 'light' ? 'dark' : 'light', isManualOverride: true});
      },
      syncWithDeviceTheme: () => {
        // Only sync if user hasn't manually overridden
        const { isManualOverride } = get();
        if (!isManualOverride) {
          const deviceTheme = getDeviceTheme();
          set({themeMode: deviceTheme});
        }
      },
      initializeTheme: () => {
        // Check if theme has been manually set before by checking storage
        const stored = mmkvStorage.getItem('theme-storage');
        if (!stored) {
          // First time - use device theme
          const deviceTheme = getDeviceTheme();
          set({themeMode: deviceTheme, isManualOverride: false});
        }
        // If theme exists in storage, persist middleware will load it
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

