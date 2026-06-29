export interface NotificationItem {
  id: string;
  type: string;
  icon: string;
  title: string;
  body: string;
  time: string;
  color: string;
  read: boolean;
}

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'order',
    icon: 'package',
    title: 'Order Shipped!',
    body: 'Your Steelbird SBA-2 Helmet is out for delivery',
    time: '10 min ago',
    color: '#8B5CF6',
    read: false,
  },
  {
    id: '2',
    type: 'service',
    icon: 'tool',
    title: 'Service Reminder',
    body: 'KTM Duke 390 service due in 500 km. Book now!',
    time: '2h ago',
    color: '#F59E0B',
    read: false,
  },
  {
    id: '3',
    type: 'offer',
    icon: 'tag',
    title: 'Flash Sale! 40% Off',
    body: 'Helmets and riding gear — today only until midnight',
    time: '5h ago',
    color: '#10B981',
    read: true,
  },
  {
    id: '4',
    type: 'community',
    icon: 'users',
    title: 'New Community Post',
    body: 'Arjun Sharma shared a ride story from Bangalore-Mysore',
    time: '1d ago',
    color: '#FF1A1A',
    read: true,
  },
  {
    id: '5',
    type: 'insurance',
    icon: 'shield',
    title: 'Insurance Reminder',
    body: 'Vehicle insurance for KA 01 HB 4832 expires in 30 days',
    time: '2d ago',
    color: '#EF4444',
    read: true,
  },
];

export async function getNotifications(): Promise<NotificationItem[]> {
  return NOTIFICATIONS;
}
