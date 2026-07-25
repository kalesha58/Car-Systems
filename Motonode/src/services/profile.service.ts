import type { ServerUser } from '../types/api';

import { api } from './api';
import { uploadImage } from './upload.service';

export async function getProfile(): Promise<ServerUser> {
  const response = await api.get<{
    success: boolean;
    Response: ServerUser;
  }>('/profile');

  if (response.data?.success && response.data.Response) {
    return response.data.Response;
  }

  throw new Error('Invalid profile response');
}

export async function updateProfile(data: {
  name?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
}): Promise<ServerUser> {
  const response = await api.put<{
    success: boolean;
    Response: ServerUser;
    message?: string;
  }>('/profile', data);

  if (response.data?.success && response.data.Response) {
    return response.data.Response;
  }

  throw new Error(response.data?.message || 'Failed to update profile');
}

/** Upload a local image, then save it as the profile photo. */
export async function updateProfilePhoto(localUri: string): Promise<ServerUser> {
  const profileImage = await uploadImage(localUri);
  return updateProfile({ profileImage });
}

export type PhoneChangeOtpResult = {
  message: string;
  resendAfterSeconds: number;
  otpExpiresInSeconds: number;
  otpLength: number;
};

export async function sendPhoneChangeOtp(phone: string): Promise<PhoneChangeOtpResult> {
  const response = await api.post<{
    success: boolean;
    Response: PhoneChangeOtpResult;
    message?: string;
  }>('/profile/phone/send-otp', { phone });

  if (response.data?.success && response.data.Response) {
    return response.data.Response;
  }

  throw new Error(response.data?.message || 'Failed to send OTP');
}

export async function verifyPhoneChange(phone: string, otp: string): Promise<ServerUser> {
  const response = await api.post<{
    success: boolean;
    Response: ServerUser;
    message?: string;
  }>('/profile/phone/verify', { phone, otp });

  if (response.data?.success && response.data.Response) {
    return response.data.Response;
  }

  throw new Error(response.data?.message || 'Failed to verify phone');
}

export type ProfileStats = {
  postsCount?: number;
  vehiclesCount?: number;
  ordersCount?: number;
  reviewsCount?: number;
};

export async function getProfileStats(): Promise<ProfileStats> {
  const response = await api.get<{
    success: boolean;
    Response: ProfileStats;
  }>('/profile/stats');

  return response.data?.Response ?? {};
}

export type NotificationSettings = {
  pushEnabled: boolean;
  orderUpdates: boolean;
  bookingUpdates: boolean;
  promotions: boolean;
  communityActivity: boolean;
  emailUpdates: boolean;
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  orderUpdates: true,
  bookingUpdates: true,
  promotions: false,
  communityActivity: true,
  emailUpdates: false,
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const response = await api.get<{
    success: boolean;
    Response: Partial<NotificationSettings>;
  }>('/profile/notification-settings');

  return { ...DEFAULT_NOTIFICATION_SETTINGS, ...(response.data?.Response ?? {}) };
}

export async function updateNotificationSettings(
  data: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  const response = await api.put<{
    success: boolean;
    Response: Partial<NotificationSettings>;
    message?: string;
  }>('/profile/notification-settings', data);

  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to update notification settings');
  }

  return { ...DEFAULT_NOTIFICATION_SETTINGS, ...(response.data.Response ?? {}) };
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const response = await api.post<{ success: boolean; message?: string }>(
    '/profile/change-password',
    { currentPassword, newPassword },
  );

  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to change password');
  }
}

/** Reversible: keeps the account data but blocks sign-in until reactivated. */
export async function deactivateAccount(reason?: string): Promise<void> {
  const response = await api.post<{ success: boolean; message?: string }>(
    '/profile/deactivate',
    { reason },
  );

  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to deactivate account');
  }
}

/** Permanent: the backend anonymizes the account's personal data. */
export async function deleteAccount(reason?: string): Promise<void> {
  const response = await api.delete<{ success: boolean; message?: string }>('/profile/account', {
    data: { reason },
  });

  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to delete account');
  }
}
