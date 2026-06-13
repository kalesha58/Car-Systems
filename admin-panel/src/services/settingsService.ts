/**
 * Settings Service
 * API calls for application settings
 */

import apiClient from './apiClient';

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

export interface IStoreBannerLink {
  type: 'category' | 'none';
  categoryId?: string;
  categoryType?: 'products' | 'services' | 'vehicles';
  serviceType?: string;
  vehicleType?: string;
}

export interface IStoreBannerItem {
  id: string;
  enabled: boolean;
  sortOrder: number;
  emoji: string;
  title: string;
  subtitle: string;
  cta: string;
  backgroundColor: string;
  link: IStoreBannerLink;
}

export interface IStoreBannersConfig {
  enabled: boolean;
  autoScrollMs: number;
  items: IStoreBannerItem[];
}

export const DEFAULT_STORE_BANNERS: IStoreBannersConfig = {
  enabled: true,
  autoScrollMs: 3500,
  items: [
    {
      id: 'doorstep',
      enabled: true,
      sortOrder: 0,
      emoji: '🔧',
      title: 'Doorstep Car Service',
      subtitle: 'Expert mechanics at your door —\nno garage visit needed',
      cta: 'Book Now',
      backgroundColor: '#1565C0',
      link: {
        type: 'category',
        categoryId: 'car-service',
        categoryType: 'services',
        serviceType: 'car_automobile',
        vehicleType: 'Car',
      },
    },
    {
      id: 'ppf',
      enabled: true,
      sortOrder: 1,
      emoji: '✨',
      title: 'Premium PPF & Detailing',
      subtitle: 'Ceramic coating & paint protection\nstarting from ₹999',
      cta: 'Explore',
      backgroundColor: '#6A1B9A',
      link: {
        type: 'category',
        categoryId: 'ppf-detailing',
        categoryType: 'services',
        serviceType: 'car_detailing',
      },
    },
    {
      id: 'tyre',
      enabled: true,
      sortOrder: 2,
      emoji: '🛞',
      title: "Tyre Puncture? We're Near",
      subtitle: 'Roadside tyre fix in 15 mins —\nanytime, anywhere',
      cta: 'Get Help',
      backgroundColor: '#BF360C',
      link: {
        type: 'category',
        categoryId: 'all-services',
        categoryType: 'services',
        serviceType: 'tire_service',
      },
    },
  ],
};

export interface ISettings {
  siteName: string;
  siteEmail: string;
  currency: string;
  taxRate: number;
  shippingCost: number;
  visualEffects: IVisualEffectsConfig;
  storeBanners: IStoreBannersConfig;
}

export interface IUpdateSettingsPayload {
  siteName?: string;
  siteEmail?: string;
  currency?: string;
  taxRate?: number;
  shippingCost?: number;
  visualEffects?: Partial<IVisualEffectsConfig> & {
    rainNotice?: Partial<IRainNoticeConfig>;
  };
  storeBanners?: Partial<IStoreBannersConfig> & {
    items?: IStoreBannerItem[];
  };
}

export interface IUpdateSettingsResponse {
  success: boolean;
  data: ISettings;
}

/**
 * Get application settings
 */
export const getSettings = async (): Promise<ISettings> => {
  const response = await apiClient.get<ISettings>('/admin/settings');
  return response.data;
};

/**
 * Update application settings
 */
export const updateSettings = async (payload: IUpdateSettingsPayload): Promise<IUpdateSettingsResponse> => {
  const response = await apiClient.put<IUpdateSettingsResponse>('/admin/settings', payload);
  return response.data;
};
