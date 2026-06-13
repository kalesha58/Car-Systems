import { appAxios } from './apiInterceptors';
import { DEFAULT_VISUAL_EFFECTS, IVisualEffectsConfig } from '../types/visualEffects';
import { DEFAULT_STORE_BANNERS, IStoreBannersConfig } from '../types/storeBanners';
import { mmkvStorage } from '@state/storage';

const CACHE_KEY = 'app-config';
const CACHE_TIMESTAMP_KEY = 'app-config-timestamp';
const LEGACY_CACHE_KEY = 'visual-effects-config';
const LEGACY_CACHE_TIMESTAMP_KEY = 'visual-effects-config-timestamp';
const CACHE_TTL_MS = 20 * 60 * 1000;

export interface IAppConfig {
  visualEffects: IVisualEffectsConfig;
  storeBanners: IStoreBannersConfig;
}

interface IAppConfigResponse {
  success: boolean;
  data: IAppConfig;
}

const DEFAULT_APP_CONFIG: IAppConfig = {
  visualEffects: DEFAULT_VISUAL_EFFECTS,
  storeBanners: DEFAULT_STORE_BANNERS,
};

const readCache = (): IAppConfig | null => {
  try {
    const raw = mmkvStorage.getItem(CACHE_KEY) ?? mmkvStorage.getItem(LEGACY_CACHE_KEY);
    const timestampRaw =
      mmkvStorage.getItem(CACHE_TIMESTAMP_KEY) ??
      mmkvStorage.getItem(LEGACY_CACHE_TIMESTAMP_KEY);
    if (!raw || !timestampRaw) return null;

    const timestamp = Number(timestampRaw);
    if (Number.isNaN(timestamp) || Date.now() - timestamp > CACHE_TTL_MS) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<IAppConfig> & IVisualEffectsConfig;
    if (parsed.visualEffects && parsed.storeBanners) {
      return parsed as IAppConfig;
    }

    return {
      visualEffects: parsed as IVisualEffectsConfig,
      storeBanners: DEFAULT_STORE_BANNERS,
    };
  } catch {
    return null;
  }
};

const writeCache = (config: IAppConfig): void => {
  mmkvStorage.setItem(CACHE_KEY, JSON.stringify(config));
  mmkvStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()));
};

export const getCachedAppConfig = (): IAppConfig | null => readCache();

export const fetchAppConfig = async (forceRefresh = false): Promise<IAppConfig> => {
  if (!forceRefresh) {
    const cached = readCache();
    if (cached) return cached;
  }

  try {
    const response = await appAxios.get<IAppConfigResponse>('/app/config');
    const config: IAppConfig = {
      visualEffects: response.data?.data?.visualEffects ?? DEFAULT_VISUAL_EFFECTS,
      storeBanners: response.data?.data?.storeBanners ?? DEFAULT_STORE_BANNERS,
    };
    writeCache(config);
    return config;
  } catch {
    const staleCache = (() => {
      try {
        const raw = mmkvStorage.getItem(CACHE_KEY) ?? mmkvStorage.getItem(LEGACY_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<IAppConfig> & IVisualEffectsConfig;
        if (parsed.visualEffects && parsed.storeBanners) {
          return parsed as IAppConfig;
        }
        return {
          visualEffects: parsed as IVisualEffectsConfig,
          storeBanners: DEFAULT_STORE_BANNERS,
        };
      } catch {
        return null;
      }
    })();

    return staleCache ?? DEFAULT_APP_CONFIG;
  }
};

/** @deprecated Use fetchAppConfig */
export const fetchVisualEffectsConfig = async (
  forceRefresh = false,
): Promise<IVisualEffectsConfig> => {
  const config = await fetchAppConfig(forceRefresh);
  return config.visualEffects;
};

/** @deprecated Use getCachedAppConfig */
export const getCachedVisualEffects = (): IVisualEffectsConfig | null => {
  const cached = readCache();
  return cached?.visualEffects ?? null;
};
