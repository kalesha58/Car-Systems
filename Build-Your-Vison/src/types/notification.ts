export interface INotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  category?: 'orders' | 'dealers' | 'payment_failed' | 'products' | 'users' | string;
}




