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
