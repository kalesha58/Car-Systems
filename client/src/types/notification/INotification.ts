export type NotificationType = 'order_update' | 'service_update' | 'general';

export interface INotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    orderId?: string;
    serviceId?: string;
    status?: string;
    [key: string]: any;
  };
  read: boolean;
  readAt?: string;
  relatedId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IGetNotificationsResponse {
  notifications: INotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IGetNotificationsParams {
  page?: number;
  limit?: number;
  read?: boolean;
}
