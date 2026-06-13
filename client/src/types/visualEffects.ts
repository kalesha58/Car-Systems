export type SeasonType = 'winter' | 'spring' | 'summer' | 'autumn' | 'default';
export type BackgroundEffectId = 'rain' | 'snow' | 'sakura' | 'none';
export type OverlayEffectId = 'winter_train' | 'christmas_sleigh' | 'none';
export type SeasonMode = 'auto' | 'manual';

export interface IRainNoticeConfig {
  enabled: boolean;
  autoShowOnHomeLoad: boolean;
  autoHideAfterMs: number;
  title: string;
  subtitle: string;
}

export interface IVisualEffectsConfig {
  enabled: boolean;
  seasonMode: SeasonMode;
  manualSeason: SeasonType;
  backgroundEffect: BackgroundEffectId;
  overlayEffect: OverlayEffectId;
  headerColor: string | null;
  backgroundSpeed: number;
  showOverlayOnHome: boolean;
  showOverlayOnDealerDashboard: boolean;
  rainNotice: IRainNoticeConfig;
}

export const DEFAULT_VISUAL_EFFECTS: IVisualEffectsConfig = {
  enabled: true,
  seasonMode: 'auto',
  manualSeason: 'default',
  backgroundEffect: 'rain',
  overlayEffect: 'none',
  headerColor: null,
  backgroundSpeed: 0.5,
  showOverlayOnHome: true,
  showOverlayOnDealerDashboard: true,
  rainNotice: {
    enabled: true,
    autoShowOnHomeLoad: true,
    autoHideAfterMs: 3500,
    title: "It's raining near this location",
    subtitle: 'Our delivery partners may take longer to reach you',
  },
};
