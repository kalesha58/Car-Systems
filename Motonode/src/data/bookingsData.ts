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
