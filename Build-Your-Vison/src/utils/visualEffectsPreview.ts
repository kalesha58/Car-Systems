import type {
  BackgroundEffectId,
  IVisualEffectsConfig,
  OverlayEffectId,
  SeasonType,
} from '@services/settingsService';

const SEASON_COLORS: Record<SeasonType, string> = {
  winter: '#4A90E2',
  spring: '#81C784',
  summer: '#FFA726',
  autumn: '#D4A574',
  default: '#f7ca49',
};

const SEASON_ENABLED: Record<SeasonType, boolean> = {
  winter: true,
  spring: true,
  summer: false,
  autumn: false,
  default: true,
};

export const getSeasonFromCalendar = (): SeasonType => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
};

export const resolvePreviewSeason = (config: IVisualEffectsConfig): SeasonType => {
  if (config.seasonMode === 'manual') {
    return config.manualSeason;
  }
  const season = getSeasonFromCalendar();
  return SEASON_ENABLED[season] ? season : 'default';
};

export const resolvePreviewHeaderColor = (config: IVisualEffectsConfig): string => {
  if (config.headerColor) {
    return config.headerColor;
  }
  const season = resolvePreviewSeason(config);
  return SEASON_COLORS[season];
};

export const shouldShowBackgroundEffect = (
  config: IVisualEffectsConfig,
): BackgroundEffectId | null => {
  if (!config.enabled || config.backgroundEffect === 'none') {
    return null;
  }
  return config.backgroundEffect;
};

export const shouldShowOverlayEffect = (
  config: IVisualEffectsConfig,
): OverlayEffectId | null => {
  if (!config.enabled || !config.showOverlayOnHome || config.overlayEffect === 'none') {
    return null;
  }
  return config.overlayEffect;
};

export const getAnimationDuration = (speed: number): string => {
  const base = 1.2;
  const duration = base / Math.max(speed, 0.1);
  return `${duration.toFixed(2)}s`;
};
