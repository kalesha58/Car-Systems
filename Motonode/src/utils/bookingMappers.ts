import {
  advanceTimeline,
  createServiceTimeline,
  createTestDriveTimeline,
  type BookingStatus,
  type CustomerBooking,
} from '@data/bookingsData';
import type { IServiceBooking, ServiceBookingStatus } from '../types/serviceBooking';
import type { ITestDrive, TestDriveStatus } from '../types/testDrive';

export function mapTestDriveStatus(status: TestDriveStatus): BookingStatus {
  if (status === 'approved') return 'confirmed';
  return status as BookingStatus;
}

export function mapServiceBookingStatus(status: ServiceBookingStatus): BookingStatus {
  const map: Record<ServiceBookingStatus, BookingStatus> = {
    new: 'pending',
    scheduled: 'confirmed',
    in_progress: 'in_progress',
    awaiting: 'in_progress',
    completed: 'completed',
    cancelled: 'cancelled',
  };
  return map[status];
}

export function mapTestDriveToCustomerBooking(td: ITestDrive): CustomerBooking {
  const status = mapTestDriveStatus(td.status);
  const timeline = createTestDriveTimeline();
  return {
    id: td.id,
    type: 'test_drive',
    customerId: td.userId,
    customerName: td.customerName ?? 'Customer',
    customerPhone: '',
    dealerId: td.dealerId,
    status,
    date: td.preferredDate,
    timeSlot: td.preferredTime,
    total: 0,
    createdAt: td.createdAt,
    vehicleListingId: td.vehicleId,
    vehicleName: td.vehicleLabel ?? '',
    vehicleBrand: '',
    vehicleImage: td.vehicleImage,
    dealerName: td.dealerName,
    notes: td.notes,
    paymentStatus: 'paid',
    timeline: advanceTimeline(timeline, status),
  };
}

export function mapServiceBookingToCustomerBooking(sb: IServiceBooking): CustomerBooking {
  const status = mapServiceBookingStatus(sb.status);
  const timeline = createServiceTimeline(true);
  const vehicleBrand = sb.vehicleInfo?.brand ?? '';
  const vehicleName = sb.vehicleInfo?.model ?? sb.vehicleName ?? '';
  const vehicleReg = sb.vehicleInfo?.registrationNumber ?? '';
  return {
    id: sb.id,
    type: 'service',
    customerId: sb.userId,
    customerName: sb.customerName ?? 'Customer',
    customerPhone: '',
    dealerId: sb.dealerId,
    status,
    date: sb.bookingDate,
    timeSlot: sb.bookingTime ?? '',
    total: 0,
    createdAt: sb.createdAt,
    serviceId: sb.serviceId,
    serviceName: sb.serviceName ?? sb.serviceRequest,
    vehicleBrand,
    vehicleName,
    vehicleReg,
    workshopName: sb.dealerName,
    workshopAddress: sb.requestLocation?.address,
    locationType: sb.requestLocation ? 'pickup' : 'workshop',
    notes: sb.notes,
    paymentStatus: 'paid',
    timeline: advanceTimeline(timeline, status),
  };
}

export function getBookingDateOptions(count = 7): { label: string; value: string }[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toISOString().slice(0, 10);
    let label: string;
    if (i === 0) label = 'Today';
    else if (i === 1) label = 'Tomorrow';
    else
      label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    return { label, value };
  });
}

export function formatSlotTime(startTime: string): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  if (Number.isNaN(hours)) return startTime;
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  const m = minutes ? `:${String(minutes).padStart(2, '0')}` : '';
  return `${h}${m} ${period}`;
}
