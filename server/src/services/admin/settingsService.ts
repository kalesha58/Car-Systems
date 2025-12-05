import { Settings, ISettingsDocument } from '../../models/Settings';
import { ISettings, IUpdateSettingsRequest } from '../../types/admin';
import { logger } from '../../utils/logger';

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
  };
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

    await settings.save();

    logger.info('Settings updated');

    return settingsToISettings(settings);
  } catch (error) {
    logger.error('Error updating settings:', error);
    throw error;
  }
};

