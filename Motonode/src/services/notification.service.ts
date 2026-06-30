import type {
  IGetNotificationsParams,
  IGetNotificationsResponse,
  INotification,
} from '../types/notification';
import { api } from './api';

export type { INotification };

export async function getNotifications(
  params: IGetNotificationsParams = {},
): Promise<IGetNotificationsResponse> {
  const response = await api.get<{ success: boolean; Response: IGetNotificationsResponse }>(
    '/user/notifications',
    { params },
  );
  return response.data.Response;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await api.put(`/user/notifications/${notificationId}/read`);
}

export async function markAllNotificationsAsRead(): Promise<{ count: number }> {
  const response = await api.put<{ success: boolean; Response: { count: number } }>(
    '/user/notifications/read-all',
  );
  return response.data.Response;
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const response = await api.get<{ success: boolean; Response: { count: number } }>(
      '/user/notifications/unread-count',
    );
    return response.data.Response?.count ?? 0;
  } catch {
    try {
      const fallback = await api.get<{ success: boolean; Response: IGetNotificationsResponse }>(
        '/user/notifications',
        { params: { page: 1, limit: 1, read: false } },
      );
      return fallback.data.Response?.total ?? 0;
    } catch {
      return 0;
    }
  }
}
