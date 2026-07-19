import type { ServerUser } from '../types/api';

import { api } from './api';

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
