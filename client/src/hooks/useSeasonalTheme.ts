import { useMemo } from 'react';
import { resolveVisualTheme, ISeasonalTheme } from '@config/seasonalThemes';
import { useVisualEffectsStore } from '@state/visualEffectsStore';

/**
 * Custom hook for accessing the current seasonal theme (admin-controlled).
 */
export const useSeasonalTheme = (): ISeasonalTheme & { isActive: boolean } => {
  const config = useVisualEffectsStore(state => state.config);

  const theme = useMemo(() => resolveVisualTheme(config), [config]);

  return {
    ...theme,
    isActive: theme.enabled,
  };
};
