export type BookingType = 'service' | 'test_drive';

export type BookingStatus =
  | 'upcoming'
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type BookingFilter =
  | 'all'
  | 'upcoming'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface BookingTimelineStep {
  key: string;
  label: string;
  completed: boolean;
  active: boolean;
  dateLabel?: string;
}

export interface CustomerBooking {
  id: string;
  type: BookingType;
  customerId: string;
  customerName: string;
  customerPhone: string;
  dealerId: string;
  status: BookingStatus;
  date: string;
  timeSlot: string;
  total: number;
  createdAt: string;
  serviceId?: string;
  serviceName?: string;
  serviceImage?: string;
  vehicleId?: string;
  vehicleBrand?: string;
  vehicleName?: string;
  vehicleReg?: string;
  vehicleYear?: number;
  vehicleFuel?: string;
  vehicleImage?: string;
  workshopId?: string;
  workshopName?: string;
  workshopAddress?: string;
  workshopDistance?: string;
  locationType?: 'workshop' | 'pickup';
  addonNames?: string[];
  paymentStatus?: 'paid' | 'pending';
  vehicleListingId?: string;
  dealerName?: string;
  notes?: string;
  customerEmail?: string;
  timeline: BookingTimelineStep[];
}

export function createServiceTimeline(paymentPaid = true): BookingTimelineStep[] {
  return [
    { key: 'booked', label: 'Booked', completed: true, active: false, dateLabel: 'Today' },
    { key: 'in_progress', label: 'In Progress', completed: false, active: false },
    { key: 'completed', label: 'Service Completed', completed: false, active: false },
    {
      key: 'payment',
      label: 'Payment',
      completed: paymentPaid,
      active: false,
      dateLabel: paymentPaid ? 'Paid' : undefined,
    },
  ];
}

export function createTestDriveTimeline(): BookingTimelineStep[] {
  return [
    { key: 'booked', label: 'Booked', completed: true, active: false, dateLabel: 'Today' },
    { key: 'in_progress', label: 'In Progress', completed: false, active: false },
    { key: 'completed', label: 'Drive Completed', completed: false, active: false },
    { key: 'payment', label: 'Payment', completed: true, active: false, dateLabel: 'Free' },
  ];
}

export function advanceTimeline(
  timeline: BookingTimelineStep[],
  status: BookingStatus,
): BookingTimelineStep[] {
  const steps = timeline.map((s) => ({ ...s, completed: false, active: false }));

  if (status === 'upcoming' || status === 'pending' || status === 'confirmed') {
    steps[0] = { ...steps[0], completed: true, active: status === 'confirmed' };
    return steps;
  }
  if (status === 'in_progress') {
    steps[0] = { ...steps[0], completed: true };
    steps[1] = { ...steps[1], completed: false, active: true };
    return steps;
  }
  if (status === 'completed') {
    steps[0] = { ...steps[0], completed: true };
    steps[1] = { ...steps[1], completed: true };
    steps[2] = { ...steps[2], completed: true, active: false };
    steps[3] = { ...steps[3], completed: true };
    return steps;
  }
  return steps;
}

export function matchesBookingFilter(booking: CustomerBooking, filter: BookingFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'upcoming') {
    return (
      booking.status === 'upcoming' ||
      booking.status === 'confirmed' ||
      booking.status === 'pending'
    );
  }
  if (filter === 'in_progress') return booking.status === 'in_progress';
  if (filter === 'completed') return booking.status === 'completed';
  if (filter === 'cancelled') {
    return booking.status === 'cancelled' || booking.status === 'rejected';
  }
  return true;
}

export function getStatusLabel(status: BookingStatus): string {
  const map: Record<BookingStatus, string> = {
    upcoming: 'Upcoming',
    pending: 'Pending',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
  };
  return map[status];
}

export function getStatusColor(status: BookingStatus): string {
  const map: Record<BookingStatus, string> = {
    upcoming: '#10B981',
    pending: '#F59E0B',
    confirmed: '#10B981',
    in_progress: '#E60012',
    completed: '#10B981',
    cancelled: '#EF4444',
    rejected: '#EF4444',
  };
  return map[status];
}

export function generateMotnBookingId(): string {
  return `MOTN${Date.now().toString().slice(-6)}`;
}

export const SEED_CUSTOMER_BOOKINGS: CustomerBooking[] = [
  {
    id: 'MOTN283746',
    type: 'service',
    customerId: 'u1',
    customerName: 'Arjun Sharma',
    customerPhone: '+91 98765 43210',
    dealerId: 'd5',
    status: 'upcoming',
    date: '2026-06-24',
    timeSlot: '10:00 AM',
    total: 4799,
    createdAt: '2026-06-20T10:00:00.000Z',
    serviceId: 's1',
    serviceName: 'Full Car Spa & Detailing',
    serviceImage:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    vehicleId: 'gv1',
    vehicleBrand: 'Tata',
    vehicleName: 'Nexon EV',
    vehicleReg: 'KA 05 EV 2210',
    vehicleYear: 2024,
    vehicleFuel: 'Electric',
    vehicleImage:
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500&auto=format&fit=crop&q=80',
    workshopId: 'w1',
    workshopName: 'Speed Auto Detailing',
    workshopAddress: 'MG Road, Koramangala, Bengaluru',
    workshopDistance: '2.3 km',
    locationType: 'workshop',
    addonNames: ['Air Filter Cleaning', 'Cabin Filter Replacement'],
    paymentStatus: 'paid',
    customerEmail: 'arjun.sharma@email.com',
    notes: 'Please check the brakes, there is a slight noise while applying brakes.',
    timeline: createServiceTimeline(true),
  },
  {
    id: 'MOTN283512',
    type: 'service',
    customerId: 'u1',
    customerName: 'Arjun Sharma',
    customerPhone: '+91 98765 43210',
    dealerId: 'd6',
    status: 'in_progress',
    date: '2026-06-22',
    timeSlot: '2:00 PM',
    total: 1299,
    createdAt: '2026-06-18T14:00:00.000Z',
    serviceId: 's3',
    serviceName: 'AC Deep Cleaning',
    serviceImage:
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80',
    vehicleId: 'gv2',
    vehicleBrand: 'Tata',
    vehicleName: 'Nexon EV',
    vehicleReg: 'KA 01 AB 1234',
    vehicleYear: 2023,
    vehicleFuel: 'Electric',
    vehicleImage:
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=500&auto=format&fit=crop&q=80',
    workshopId: 'w2',
    workshopName: 'Krishna Bike Workshop',
    workshopAddress: 'HSR Layout, Sector 2, Bengaluru',
    workshopDistance: '1.1 km',
    locationType: 'workshop',
    paymentStatus: 'paid',
    timeline: advanceTimeline(createServiceTimeline(true), 'in_progress'),
  },
  {
    id: 'MOTN281900',
    type: 'service',
    customerId: 'u1',
    customerName: 'Arjun Sharma',
    customerPhone: '+91 98765 43210',
    dealerId: 'd5',
    status: 'completed',
    date: '2026-06-15',
    timeSlot: '11:00 AM',
    total: 2999,
    createdAt: '2026-06-10T09:00:00.000Z',
    serviceId: 's1',
    serviceName: 'Full Car Spa & Detailing',
    serviceImage:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    vehicleId: 'gv1',
    vehicleBrand: 'Tata',
    vehicleName: 'Nexon EV',
    vehicleReg: 'KA 05 EV 2210',
    vehicleYear: 2024,
    vehicleFuel: 'Electric',
    vehicleImage:
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500&auto=format&fit=crop&q=80',
    workshopId: 'w1',
    workshopName: 'Speed Auto Detailing',
    workshopAddress: 'MG Road, Koramangala, Bengaluru',
    workshopDistance: '2.3 km',
    locationType: 'workshop',
    paymentStatus: 'paid',
    timeline: advanceTimeline(createServiceTimeline(true), 'completed'),
  },
  {
    id: 'TD-001',
    type: 'test_drive',
    customerId: 'u1',
    customerName: 'Arjun Sharma',
    customerPhone: '+91 98765 43210',
    dealerId: 'd1',
    status: 'confirmed',
    date: '2026-06-29',
    timeSlot: '10:00 AM',
    total: 0,
    createdAt: '2026-06-19T11:00:00.000Z',
    vehicleListingId: 'v3',
    vehicleName: 'Tata Nexon EV',
    vehicleBrand: 'Tata',
    vehicleImage:
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=500&auto=format&fit=crop&q=80',
    dealerName: 'Motonode Koramangala',
    notes: 'Customer wants a city ride test, 20 mins',
    paymentStatus: 'paid',
    timeline: advanceTimeline(createTestDriveTimeline(), 'confirmed'),
  },
];
