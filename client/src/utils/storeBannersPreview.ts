import {
  DEFAULT_STORE_BANNERS,
  IStoreBannerItem,
  IStoreBannerLink,
  IStoreBannersConfig,
} from '@types/storeBanners';

export type {
  IStoreBannerItem,
  IStoreBannerLink,
  IStoreBannersConfig,
};

export { DEFAULT_STORE_BANNERS };

export const getEnabledStoreBanners = (config: IStoreBannersConfig): IStoreBannerItem[] => {
  if (!config.enabled) {
    return [];
  }

  return [...config.items]
    .filter((item) => item.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);
};
