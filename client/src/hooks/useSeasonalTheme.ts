import { useMemo } from 'react';
import { getCurrentSeasonalTheme, ISeasonalTheme } from '@config/seasonalThemes';

/**
 * Custom hook for accessing the current seasonal theme
 * 
 * Usage:
 * const { season, colors, animations, isActive } = useSeasonalTheme();
 */
export const useSeasonalTheme = (): ISeasonalTheme & { isActive: boolean } => {
    const theme = useMemo(() => getCurrentSeasonalTheme(), []);

    return {
        ...theme,
        isActive: theme.enabled,
    };
};
