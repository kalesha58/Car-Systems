import { create } from 'zustand';
import { DEFAULT_VISUAL_EFFECTS, IVisualEffectsConfig, IRainNoticeConfig } from '@types/visualEffects';
import { DEFAULT_STORE_BANNERS, IStoreBannersConfig } from '@types/storeBanners';
import { resolveVisualTheme, ISeasonalTheme } from '@config/seasonalThemes';
import { fetchAppConfig, getCachedAppConfig } from '@service/appConfigService';
import { getEnabledStoreBanners } from '@utils/storeBannersPreview';

interface IAppConfigStore {
  visualEffects: IVisualEffectsConfig;
  storeBanners: IStoreBannersConfig;
  isLoading: boolean;
  isHydrated: boolean;
  fetchAppConfig: (forceRefresh?: boolean) => Promise<void>;
  getResolvedTheme: () => ISeasonalTheme;
  getRainNoticeConfig: () => IRainNoticeConfig;
  getActiveStoreBanners: () => ReturnType<typeof getEnabledStoreBanners>;
}

const cached = getCachedAppConfig();

export const useAppConfigStore = create<IAppConfigStore>((set, get) => ({
  visualEffects: cached?.visualEffects ?? DEFAULT_VISUAL_EFFECTS,
  storeBanners: cached?.storeBanners ?? DEFAULT_STORE_BANNERS,
  isLoading: false,
  isHydrated: false,

  fetchAppConfig: async (forceRefresh = false) => {
    set({ isLoading: true });
    try {
      const config = await fetchAppConfig(forceRefresh);
      set({
        visualEffects: config.visualEffects,
        storeBanners: config.storeBanners,
        isHydrated: true,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  getResolvedTheme: () => resolveVisualTheme(get().visualEffects),

  getRainNoticeConfig: () => get().visualEffects.rainNotice,

  getActiveStoreBanners: () => getEnabledStoreBanners(get().storeBanners),
}));
