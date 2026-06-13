import { Settings, ISettingsDocument } from '../../models/Settings';
import {
  IAppConfig,
  ISettings,
  IStoreBannerItem,
  IStoreBannersConfig,
  IUpdateSettingsRequest,
  IVisualEffectsConfig,
} from '../../types/admin';
import { DEFAULT_VISUAL_EFFECTS } from '../../constants/visualEffectsDefaults';
import { DEFAULT_STORE_BANNERS, MAX_STORE_BANNERS } from '../../constants/storeBannersDefaults';
import { logger } from '../../utils/logger';

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

const visualEffectsToPlain = (visualEffects: IVisualEffectsConfig): IVisualEffectsConfig => ({
  enabled: visualEffects.enabled,
  seasonMode: visualEffects.seasonMode,
  manualSeason: visualEffects.manualSeason,
  backgroundEffect: visualEffects.backgroundEffect,
  overlayEffect: visualEffects.overlayEffect,
  headerColor: visualEffects.headerColor ?? null,
  backgroundSpeed: visualEffects.backgroundSpeed,
  showOverlayOnHome: visualEffects.showOverlayOnHome,
  showOverlayOnDealerDashboard: visualEffects.showOverlayOnDealerDashboard,
  rainNotice: {
    enabled: visualEffects.rainNotice.enabled,
    autoShowOnHomeLoad: visualEffects.rainNotice.autoShowOnHomeLoad,
    autoHideAfterMs: visualEffects.rainNotice.autoHideAfterMs,
    title: visualEffects.rainNotice.title,
    subtitle: visualEffects.rainNotice.subtitle,
  },
});

const storeBannerItemToPlain = (item: IStoreBannerItem): IStoreBannerItem => ({
  id: item.id,
  enabled: item.enabled,
  sortOrder: item.sortOrder,
  emoji: item.emoji,
  title: item.title,
  subtitle: item.subtitle,
  cta: item.cta,
  backgroundColor: item.backgroundColor,
  link: {
    type: item.link?.type ?? 'none',
    categoryId: item.link?.categoryId,
    categoryType: item.link?.categoryType,
    serviceType: item.link?.serviceType,
    vehicleType: item.link?.vehicleType,
  },
});

const storeBannersToPlain = (storeBanners: IStoreBannersConfig): IStoreBannersConfig => ({
  enabled: storeBanners.enabled,
  autoScrollMs: storeBanners.autoScrollMs,
  items: (storeBanners.items ?? []).map(storeBannerItemToPlain).sort((a, b) => a.sortOrder - b.sortOrder),
});

/**
 * Convert settings document to ISettings interface
 */
const settingsToISettings = (settingsDoc: ISettingsDocument): ISettings => {
  return {
    siteName: settingsDoc.siteName,
    siteEmail: settingsDoc.siteEmail,
    currency: settingsDoc.currency,
    taxRate: settingsDoc.taxRate,
    shippingCost: settingsDoc.shippingCost,
    visualEffects: visualEffectsToPlain(settingsDoc.visualEffects ?? DEFAULT_VISUAL_EFFECTS),
    storeBanners: storeBannersToPlain(settingsDoc.storeBanners ?? DEFAULT_STORE_BANNERS),
  };
};

const mergeVisualEffects = (
  current: IVisualEffectsConfig,
  update: NonNullable<IUpdateSettingsRequest['visualEffects']>,
): IVisualEffectsConfig => {
  const merged: IVisualEffectsConfig = {
    ...current,
    ...update,
    rainNotice: {
      ...current.rainNotice,
      ...(update.rainNotice ?? {}),
    },
  };

  if (merged.backgroundSpeed < 0.1 || merged.backgroundSpeed > 3) {
    throw new Error('Background speed must be between 0.1 and 3');
  }

  if (merged.rainNotice.autoHideAfterMs < 0) {
    throw new Error('Rain notice auto-hide delay cannot be negative');
  }

  if (merged.headerColor !== null && merged.headerColor !== undefined) {
    const trimmed = merged.headerColor.trim();
    if (trimmed && !HEX_COLOR_RE.test(trimmed)) {
      throw new Error('Header color must be a valid hex color (e.g. #f7ca49) or null');
    }
    merged.headerColor = trimmed || null;
  }

  return merged;
};

const validateStoreBannerItem = (item: IStoreBannerItem, index: number): IStoreBannerItem => {
  if (!item.id?.trim()) {
    throw new Error(`Banner at index ${index} must have an id`);
  }
  if (!item.title?.trim()) {
    throw new Error(`Banner "${item.id}" must have a title`);
  }
  if (!HEX_COLOR_RE.test(item.backgroundColor?.trim() ?? '')) {
    throw new Error(`Banner "${item.id}" must have a valid hex background color`);
  }
  if (item.link?.type === 'category' && !item.link.categoryId?.trim()) {
    throw new Error(`Banner "${item.id}" with category link must have a categoryId`);
  }

  return storeBannerItemToPlain({
    ...item,
    id: item.id.trim(),
    title: item.title.trim(),
    subtitle: item.subtitle?.trim() ?? '',
    cta: item.cta?.trim() || 'Learn More',
    emoji: item.emoji?.trim() || '🎯',
    backgroundColor: item.backgroundColor.trim(),
    sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : index,
  });
};

const mergeStoreBanners = (
  current: IStoreBannersConfig,
  update: NonNullable<IUpdateSettingsRequest['storeBanners']>,
): IStoreBannersConfig => {
  const merged: IStoreBannersConfig = {
    ...current,
    ...update,
    items: update.items !== undefined ? update.items : current.items,
  };

  if (merged.autoScrollMs < 0) {
    throw new Error('Auto-scroll interval cannot be negative');
  }

  if (merged.items.length > MAX_STORE_BANNERS) {
    throw new Error(`Maximum ${MAX_STORE_BANNERS} store banners allowed`);
  }

  merged.items = merged.items.map(validateStoreBannerItem).sort((a, b) => a.sortOrder - b.sortOrder);

  return merged;
};

/**
 * Get settings
 */
export const getSettings = async (): Promise<ISettings> => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    return settingsToISettings(settings);
  } catch (error) {
    logger.error('Error getting settings:', error);
    throw error;
  }
};

/**
 * Update settings
 */
export const updateSettings = async (data: IUpdateSettingsRequest): Promise<ISettings> => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    if (data.siteName !== undefined) settings.siteName = data.siteName;
    if (data.siteEmail !== undefined) settings.siteEmail = data.siteEmail;
    if (data.currency !== undefined) settings.currency = data.currency;
    if (data.taxRate !== undefined) {
      if (data.taxRate < 0 || data.taxRate > 100) {
        throw new Error('Tax rate must be between 0 and 100');
      }
      settings.taxRate = data.taxRate;
    }
    if (data.shippingCost !== undefined) {
      if (data.shippingCost < 0) {
        throw new Error('Shipping cost cannot be negative');
      }
      settings.shippingCost = data.shippingCost;
    }

    if (data.visualEffects !== undefined) {
      const current = visualEffectsToPlain(settings.visualEffects ?? DEFAULT_VISUAL_EFFECTS);
      settings.visualEffects = mergeVisualEffects(current, data.visualEffects);
      settings.markModified('visualEffects');
    }

    if (data.storeBanners !== undefined) {
      const current = storeBannersToPlain(settings.storeBanners ?? DEFAULT_STORE_BANNERS);
      settings.storeBanners = mergeStoreBanners(current, data.storeBanners);
      settings.markModified('storeBanners');
    }

    await settings.save();

    logger.info('Settings updated');

    return settingsToISettings(settings);
  } catch (error) {
    logger.error('Error updating settings:', error);
    throw error;
  }
};

/**
 * Get visual effects config for public mobile API
 */
export const getVisualEffectsConfig = async (): Promise<IVisualEffectsConfig> => {
  const settings = await getSettings();
  return settings.visualEffects;
};

/**
 * Get unified app config for mobile clients
 */
export const getAppConfig = async (): Promise<IAppConfig> => {
  const settings = await getSettings();
  return {
    visualEffects: settings.visualEffects,
    storeBanners: settings.storeBanners,
  };
};
