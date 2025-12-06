import {ThemeMode} from '@state/themeStore';

export interface IThemeColors {
  primary: string;
  primaryLight: string;
  secondary: string;
  text: string;
  textSecondary: string;
  disabled: string;
  border: string;
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  cardBackground: string;
  error: string;
  success: string;
  warning: string;
  white: string;
  black: string;
}

const lightColors: IThemeColors = {
  primary: '#f7ca49',
  primaryLight: '#ffe141',
  secondary: '#0d8320',
  text: '#363636',
  textSecondary: '#666666',
  disabled: '#9197a6',
  border: '#d0d4dc',
  background: '#ffffff',
  backgroundSecondary: '#f5f6fb',
  backgroundTertiary: '#fafafa',
  cardBackground: '#ffffff',
  error: '#e74c3c',
  success: '#0d8320',
  warning: '#f39c12',
  white: '#ffffff',
  black: '#000000',
};

const darkColors: IThemeColors = {
  primary: '#f7ca49',
  primaryLight: '#ffe141',
  secondary: '#0d8320',
  text: '#E0E0E0',
  textSecondary: '#B0B0B0',
  disabled: '#6B7280',
  border: '#374151',
  background: '#121212',
  backgroundSecondary: '#1E1E1E',
  backgroundTertiary: '#2A2A2A',
  cardBackground: '#1E1E1E',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  white: '#ffffff',
  black: '#000000',
};

export const getThemeColors = (themeMode: ThemeMode): IThemeColors => {
  return themeMode === 'dark' ? darkColors : lightColors;
};

