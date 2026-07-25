import colors, { type ColorPalette } from '@theme/colors';
import { useTheme } from '../context/ThemeContext';

export function useColors(): ColorPalette {
  const { isDark } = useTheme();
  const palette = isDark ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius, gradients: colors.gradients };
}
