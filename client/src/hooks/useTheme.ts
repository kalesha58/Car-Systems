import {useThemeStore} from '@state/themeStore';
import {getThemeColors, IThemeColors} from '@config/theme';

export const useTheme = (): {
  themeMode: 'light' | 'dark';
  colors: IThemeColors;
  isDark: boolean;
} => {
  const themeMode = useThemeStore(state => state.themeMode);
  const colors = getThemeColors(themeMode);

  return {
    themeMode,
    colors,
    isDark: themeMode === 'dark',
  };
};

