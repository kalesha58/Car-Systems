/**
 * Settings Service
 * API calls for application settings
 */

import apiClient from './apiClient';

export interface ISettings {
  siteName: string;
  siteEmail: string;
  currency: string;
  taxRate: number;
  shippingCost: number;
}

export interface IUpdateSettingsPayload {
  siteName?: string;
  siteEmail?: string;
  currency?: string;
  taxRate?: number;
  shippingCost?: number;
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

