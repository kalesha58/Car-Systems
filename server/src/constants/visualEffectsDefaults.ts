import { IVisualEffectsConfig } from '../types/admin';

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
