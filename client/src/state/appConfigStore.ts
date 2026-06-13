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

const applyConfig = (
  set: (partial: Partial<IAppConfigStore>) => void,
  config: { visualEffects: IVisualEffectsConfig; storeBanners: IStoreBannersConfig },
): void => {
  set({
    visualEffects: config.visualEffects,
    storeBanners: config.storeBanners,
    isHydrated: true,
  });
};

export const useAppConfigStore = create<IAppConfigStore>((set, get) => ({
  visualEffects: cached?.visualEffects ?? DEFAULT_VISUAL_EFFECTS,
  storeBanners: cached?.storeBanners ?? DEFAULT_STORE_BANNERS,
  isLoading: false,
  isHydrated: !!cached,

  fetchAppConfig: async (forceRefresh = false) => {
    if (!forceRefresh) {
      const localCache = getCachedAppConfig();
      if (localCache) {
        applyConfig(set, localCache);

        try {
          const freshConfig = await fetchAppConfig(true);
          applyConfig(set, freshConfig);
        } catch {
          // Keep cached values when background revalidation fails.
        }
        return;
      }
    }

    set({ isLoading: true });
    try {
      const config = await fetchAppConfig(forceRefresh);
      applyConfig(set, config);
    } finally {
      set({ isLoading: false });
    }
  },

  getResolvedTheme: () => resolveVisualTheme(get().visualEffects),

  getRainNoticeConfig: () => get().visualEffects.rainNotice,

  getActiveStoreBanners: () => getEnabledStoreBanners(get().storeBanners),
}));
