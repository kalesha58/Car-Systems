import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
} from '@constants/auth';
import { setString, StorageKeys } from '@storage/index';
import type { LoginResult, ServerUser, SignupRole } from '../types/api';

import { clearAuthTokens, publicApi, refreshAccessToken } from './api';

interface LoginApiResponse {
  token?: string;
  Response?: ServerUser;
  success?: boolean;
  requiresPolicyAcceptance?: boolean;
  currentTermsVersion?: string;
  currentPrivacyVersion?: string;
}

async function persistAuthSession(token: string): Promise<void> {
  await setString(StorageKeys.ACCESS_TOKEN, token);
  await setString(StorageKeys.REFRESH_TOKEN, token);
  await setString(StorageKeys.AUTH_TOKEN, token);
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const response = await publicApi.post<LoginApiResponse>('/auth/login', {
    email: email.trim().toLowerCase(),
    password,
  });

  const data = response.data;
  const token = data.token;
  const user = data.Response;

  if (!token || !user) {
    throw new Error('Invalid login response');
  }

  await persistAuthSession(token);

  return {
    user,
    requiresPolicyAcceptance: Boolean(data.requiresPolicyAcceptance),
    currentTermsVersion: data.currentTermsVersion,
    currentPrivacyVersion: data.currentPrivacyVersion,
  };
}

export async function signup(
  name: string,
  email: string,
  phone: string,
  password: string,
  role?: SignupRole,
  termsVersion: string = CURRENT_TERMS_VERSION,
  privacyVersion: string = CURRENT_PRIVACY_VERSION,
): Promise<ServerUser> {
  const requestBody: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: SignupRole;
    termsAccepted: boolean;
    privacyAccepted: boolean;
    termsVersion: string;
    privacyVersion: string;
  } = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.replace(/[^0-9]/g, ''),
    password,
    termsAccepted: true,
    privacyAccepted: true,
    termsVersion,
    privacyVersion,
  };

  if (role) {
    requestBody.role = role;
  }

  const response = await publicApi.post<{ Response?: ServerUser }>('/auth/signup', requestBody);

  if (!response.data.Response) {
    throw new Error('Invalid signup response');
  }

  return response.data.Response;
}

export async function logout(): Promise<void> {
  try {
    const { api } = await import('./api');
    await api.post('/auth/logout');
  } catch {
    // Clear local session even when logout API fails.
  } finally {
    await clearAuthTokens();
  }
}

export { refreshAccessToken as refreshTokens, clearAuthTokens };
