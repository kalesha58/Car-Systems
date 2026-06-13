import type { IStoreBannerItem, IStoreBannersConfig } from '@services/settingsService';

export const getEnabledStoreBanners = (config: IStoreBannersConfig): IStoreBannerItem[] => {
  if (!config.enabled) {
    return [];
  }

  return [...config.items]
    .filter((item) => item.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);
};

export const shouldShowStoreBanners = (config: IStoreBannersConfig): boolean =>
  getEnabledStoreBanners(config).length > 0;

export const resolveBannerAutoScrollMs = (config: IStoreBannersConfig): number =>
  Math.max(1000, config.autoScrollMs || 3500);
