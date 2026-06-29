import { useColorScheme } from 'react-native';

import colors, { type ColorPalette } from '@theme/colors';

export function useColors(): ColorPalette {
  const scheme = useColorScheme();
  const palette = scheme === 'dark' ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius, gradients: colors.gradients };
}
