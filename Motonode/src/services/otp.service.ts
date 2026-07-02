import {
  OTP_EXPIRY_SECONDS,
  OTP_LENGTH,
  OTP_RESEND_COOLDOWN_SECONDS,
} from '@config/otpConfig';
import { setString, StorageKeys } from '@storage/index';
import type { ServerUser } from '../types/api';

import { publicApi } from './api';

export interface SendOtpResult {
  message: string;
  resendAfterSeconds: number;
  otpExpiresInSeconds: number;
  otpLength: number;
}

export interface VerifyOtpResult {
  isNewUser: boolean;
  phone?: string;
  registrationToken?: string;
  user?: ServerUser;
  token?: string;
}

async function persistAuthSession(token: string): Promise<void> {
  await setString(StorageKeys.ACCESS_TOKEN, token);
  await setString(StorageKeys.REFRESH_TOKEN, token);
  await setString(StorageKeys.AUTH_TOKEN, token);
}

export async function sendOtp(phone: string): Promise<SendOtpResult> {
  const response = await publicApi.post<{ Response?: SendOtpResult }>('/auth/send-otp', {
    phone: phone.replace(/[^0-9]/g, ''),
  });
  const data = response.data.Response;

  return (
    data ?? {
      message: 'OTP sent',
      resendAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS,
      otpExpiresInSeconds: OTP_EXPIRY_SECONDS,
      otpLength: OTP_LENGTH,
    }
  );
}

export async function verifyOtp(phone: string, otp: string): Promise<VerifyOtpResult> {
  const response = await publicApi.post<{
    isNewUser?: boolean;
    phone?: string;
    registrationToken?: string;
    token?: string;
    Response?: ServerUser;
  }>('/auth/verify-otp', {
    phone: phone.replace(/[^0-9]/g, ''),
    otp: otp.replace(/\s/g, ''),
  });

  const data = response.data;

  if (data.isNewUser) {
    return {
      isNewUser: true,
      phone: data.phone,
      registrationToken: data.registrationToken,
    };
  }

  const token = data.token;
  const user = data.Response;

  if (!token || !user) {
    throw new Error('Invalid verify OTP response');
  }

  await persistAuthSession(token);

  return {
    isNewUser: false,
    user,
    token,
  };
}

export async function resendOtp(phone: string): Promise<SendOtpResult> {
  return sendOtp(phone);
}
