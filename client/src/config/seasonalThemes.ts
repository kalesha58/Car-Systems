/**
 * Seasonal Theme Configuration
 */

import {
  BackgroundEffectId,
  IVisualEffectsConfig,
  OverlayEffectId,
  SeasonType,
  DEFAULT_VISUAL_EFFECTS,
} from '@types/visualEffects';
import {
  getBackgroundAnimationSource,
  getOverlayAnimationSource,
} from '@utils/animationConfig';

export type { SeasonType };

export interface ISeasonalTheme {
  season: SeasonType;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  animations: {
    background?: any;
    overlay?: any;
  };
  enabled: boolean;
  backgroundSpeed: number;
  showOverlayOnHome: boolean;
  showOverlayOnDealerDashboard: boolean;
}

export const seasonalThemes: Record<SeasonType, ISeasonalTheme> = {
  winter: {
    season: 'winter',
    name: 'Winter Theme',
    colors: {
      primary: '#4A90E2',
      secondary: '#6DB3F2',
      accent: '#2E5C8A',
    },
    animations: {
      background: getBackgroundAnimationSource('snow'),
      overlay: getOverlayAnimationSource('winter_train'),
    },
    enabled: true,
    backgroundSpeed: 0.5,
    showOverlayOnHome: true,
    showOverlayOnDealerDashboard: true,
  },
  spring: {
    season: 'spring',
    name: 'Spring Theme',
    colors: {
      primary: '#81C784',
      secondary: '#A5D6A7',
      accent: '#66BB6A',
    },
    animations: {
      background: getBackgroundAnimationSource('sakura'),
    },
    enabled: true,
    backgroundSpeed: 0.5,
    showOverlayOnHome: true,
    showOverlayOnDealerDashboard: true,
  },
  summer: {
    season: 'summer',
    name: 'Summer Theme',
    colors: {
      primary: '#FFA726',
      secondary: '#FFB74D',
      accent: '#FB8C00',
    },
    animations: {
      background: getBackgroundAnimationSource('rain'),
    },
    enabled: false,
    backgroundSpeed: 0.5,
    showOverlayOnHome: true,
    showOverlayOnDealerDashboard: true,
  },
  autumn: {
    season: 'autumn',
    name: 'Autumn Theme',
    colors: {
      primary: '#D4A574',
      secondary: '#E6C9A8',
      accent: '#A67C52',
    },
    animations: {
      background: getBackgroundAnimationSource('sakura'),
    },
    enabled: false,
    backgroundSpeed: 0.5,
    showOverlayOnHome: true,
    showOverlayOnDealerDashboard: true,
  },
  default: {
    season: 'default',
    name: 'Default Theme',
    colors: {
      primary: '#f7ca49',
      secondary: '#ffe141',
      accent: '#0d8320',
    },
    animations: {
      background: getBackgroundAnimationSource('rain'),
    },
    enabled: true,
    backgroundSpeed: 0.5,
    showOverlayOnHome: true,
    showOverlayOnDealerDashboard: true,
  },
};

export const getSeasonFromCalendar = (): SeasonType => {
  const month = new Date().getMonth();

  if (month >= 2 && month <= 4) {
    return 'spring';
  }
  if (month >= 5 && month <= 7) {
    return 'summer';
  }
  if (month >= 8 && month <= 10) {
    return 'autumn';
  }
  return 'winter';
};

const resolveSeason = (config: IVisualEffectsConfig): SeasonType => {
  if (config.seasonMode === 'manual') {
    return config.manualSeason;
  }

  const season = getSeasonFromCalendar();
  const theme = seasonalThemes[season];
  return theme.enabled ? season : 'default';
};

/**
 * Get the current active seasonal theme (local fallback)
 */
export const getCurrentSeasonalTheme = (): ISeasonalTheme => {
  return resolveVisualTheme(DEFAULT_VISUAL_EFFECTS);
};

/**
 * Merge remote admin config with local season definitions and animation registry.
 */
export const resolveVisualTheme = (config: IVisualEffectsConfig): ISeasonalTheme => {
  const season = resolveSeason(config);
  const baseTheme = seasonalThemes[season] ?? seasonalThemes.default;

  const background = config.enabled
    ? getBackgroundAnimationSource(config.backgroundEffect)
    : undefined;
  const overlay = config.enabled
    ? getOverlayAnimationSource(config.overlayEffect)
    : undefined;

  const primaryColor = config.headerColor ?? baseTheme.colors.primary;

  return {
    ...baseTheme,
    season,
    colors: {
      ...baseTheme.colors,
      primary: primaryColor,
    },
    animations: {
      background,
      overlay,
    },
    enabled: config.enabled,
    backgroundSpeed: config.backgroundSpeed,
    showOverlayOnHome: config.showOverlayOnHome,
    showOverlayOnDealerDashboard: config.showOverlayOnDealerDashboard,
  };
};
