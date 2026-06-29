import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL } from '@config/env';
import { getString, remove, setString, StorageKeys } from '@storage/index';

const DEFAULT_REQUEST_TIMEOUT_MS = 60000;

export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

export async function clearAuthTokens(): Promise<void> {
  await Promise.all([
    remove(StorageKeys.ACCESS_TOKEN),
    remove(StorageKeys.REFRESH_TOKEN),
    remove(StorageKeys.AUTH_TOKEN),
  ]);
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = await getString(StorageKeys.REFRESH_TOKEN);
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const response = await publicApi.post<{
    accessToken: string;
    refreshToken: string;
  }>('/refresh-token', {
    refershToken: refreshToken,
  });

  const { accessToken, refreshToken: newRefreshToken } = response.data;

  await setString(StorageKeys.ACCESS_TOKEN, accessToken);
  await setString(StorageKeys.REFRESH_TOKEN, newRefreshToken);
  await setString(StorageKeys.AUTH_TOKEN, accessToken);

  return accessToken;
}

api.interceptors.request.use(async config => {
  const accessToken = await getString(StorageKeys.ACCESS_TOKEN);

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = await getString(StorageKeys.REFRESH_TOKEN);
    if (!refreshToken) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise(resolve => {
        subscribeTokenRefresh((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newAccessToken = await refreshAccessToken();
      onTokenRefreshed(newAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      await clearAuthTokens();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
