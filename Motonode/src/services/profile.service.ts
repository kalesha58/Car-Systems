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
