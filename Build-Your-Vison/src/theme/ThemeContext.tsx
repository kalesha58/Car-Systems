import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { type ColorScheme,colorSchemes } from './colorSchemes';
import { ITheme } from './theme';

type ThemeMode = 'light' | 'dark' | 'auto';

interface IThemeContext {
  theme: ITheme;
  themeMode: ThemeMode;
  colorScheme: ColorScheme;
  effectiveThemeMode: 'light' | 'dark'; // The actual theme being used (resolved from 'auto')
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<IThemeContext | undefined>(undefined);

interface IThemeProviderProps {
  children: ReactNode;
}

// Get system theme preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const ThemeProvider: React.FC<IThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('themeMode');
    return (saved as ThemeMode) || 'auto';
  });

  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    const saved = localStorage.getItem('colorScheme');
    return (saved as ColorScheme) || 'blue';
  });

  // Resolve effective theme mode (handle 'auto')
  const effectiveThemeMode: 'light' | 'dark' = themeMode === 'auto' ? getSystemTheme() : themeMode;

  const [theme, setTheme] = useState<ITheme>(() => {
    const scheme = colorSchemes[colorScheme];
    return effectiveThemeMode === 'dark' ? scheme.dark : scheme.light;
  });

  // Update theme when mode or color scheme changes
  useEffect(() => {
    const scheme = colorSchemes[colorScheme];
    const resolvedMode = themeMode === 'auto' ? getSystemTheme() : themeMode;
    setTheme(resolvedMode === 'dark' ? scheme.dark : scheme.light);
    
    document.documentElement.setAttribute('data-theme', resolvedMode);
    document.documentElement.setAttribute('data-color-scheme', colorScheme);
    
    if (resolvedMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('themeMode', themeMode);
    localStorage.setItem('colorScheme', colorScheme);
  }, [themeMode, colorScheme]);

  // Listen for system theme changes when in 'auto' mode
  useEffect(() => {
    if (themeMode !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const scheme = colorSchemes[colorScheme];
      const newMode = mediaQuery.matches ? 'dark' : 'light';
      setTheme(newMode === 'dark' ? scheme.dark : scheme.light);
      document.documentElement.setAttribute('data-theme', newMode);
      if (newMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode, colorScheme]);

  const toggleTheme = () => {
    if (themeMode === 'auto') {
      setThemeModeState('light');
    } else if (themeMode === 'light') {
      setThemeModeState('dark');
    } else {
      setThemeModeState('auto');
    }
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        colorScheme,
        effectiveThemeMode,
        toggleTheme,
        setThemeMode,
        setColorScheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): IThemeContext => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

