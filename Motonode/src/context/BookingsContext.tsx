import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  advanceTimeline,
  createServiceTimeline,
  createTestDriveTimeline,
  generateMotnBookingId,
  matchesBookingFilter,
  SEED_CUSTOMER_BOOKINGS,
  type BookingFilter,
  type BookingStatus,
  type CustomerBooking,
} from '@data/bookingsData';
import {
  GARAGE_VEHICLES,
  SERVICE_ADDONS,
  SERVICE_WORKSHOPS,
  SERVICES,
} from '@data/mockData';
import type { ServiceBookingDraft } from '@context/ServiceBookingContext';
import { getJSON, setJSON, StorageKeys } from '@storage/index';

export interface CreateServiceBookingInput {
  draft: ServiceBookingDraft;
  bookingId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  total: number;
}

export interface CreateTestDriveBookingInput {
  customerId: string;
  customerName: string;
  customerPhone: string;
  dealerId: string;
  dealerName: string;
  vehicleListingId: string;
  vehicleName: string;
  vehicleBrand: string;
  vehicleImage: string;
  date: string;
  timeSlot: string;
  notes?: string;
}

interface BookingsContextValue {
  bookings: CustomerBooking[];
  isLoading: boolean;
  loadBookings: () => Promise<void>;
  getCustomerBookings: (customerId: string, filter?: BookingFilter) => CustomerBooking[];
  getDealerBookings: (
    dealerId: string,
    filter?: BookingFilter,
    type?: CustomerBooking['type'],
  ) => CustomerBooking[];
  getBookingById: (id: string) => CustomerBooking | undefined;
  createServiceBooking: (input: CreateServiceBookingInput) => Promise<CustomerBooking>;
  createTestDriveBooking: (input: CreateTestDriveBookingInput) => Promise<CustomerBooking>;
  updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
  getPendingServiceCount: (dealerId: string) => number;
  getPendingTestDriveCount: (dealerId: string) => number;
}

const BookingsContext = createContext<BookingsContextValue | null>(null);

async function persistBookings(bookings: CustomerBooking[]) {
  await setJSON(StorageKeys.CUSTOMER_BOOKINGS, bookings);
}

export function BookingsProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const stored = await getJSON<CustomerBooking[]>(StorageKeys.CUSTOMER_BOOKINGS);
      if (stored && stored.length > 0) {
        setBookings(stored);
      } else {
        setBookings(SEED_CUSTOMER_BOOKINGS);
        await persistBookings(SEED_CUSTOMER_BOOKINGS);
      }
    } catch {
      setBookings(SEED_CUSTOMER_BOOKINGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const getBookingById = useCallback(
    (id: string) => bookings.find((b) => b.id === id),
    [bookings],
  );

  const getCustomerBookings = useCallback(
    (customerId: string, filter: BookingFilter = 'all') =>
      bookings
        .filter((b) => b.customerId === customerId)
        .filter((b) => matchesBookingFilter(b, filter))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [bookings],
  );

  const getDealerBookings = useCallback(
    (
      dealerId: string,
      filter: BookingFilter = 'all',
      type?: CustomerBooking['type'],
    ) =>
      bookings
        .filter((b) => b.dealerId === dealerId || dealerId === 'd1')
        .filter((b) => (type ? b.type === type : true))
        .filter((b) => matchesBookingFilter(b, filter))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [bookings],
  );

  const createServiceBooking = useCallback(async (input: CreateServiceBookingInput) => {
    const service = SERVICES.find((s) => s.id === input.draft.serviceId);
    const vehicle = GARAGE_VEHICLES.find((v) => v.id === input.draft.vehicleId);
    const workshop = SERVICE_WORKSHOPS.find((w) => w.id === input.draft.workshopId);
    const addons = SERVICE_ADDONS.filter((a) =>
      input.draft.selectedAddonIds.includes(a.id),
    );

    const booking: CustomerBooking = {
      id: input.bookingId || generateMotnBookingId(),
      type: 'service',
      customerId: input.customerId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      dealerId: service?.dealerId ?? workshop?.dealerId ?? 'd5',
      status: 'upcoming',
      date: input.draft.date,
      timeSlot: input.draft.timeSlot,
      total: input.total,
      createdAt: new Date().toISOString(),
      serviceId: service?.id,
      serviceName: service?.name,
      serviceImage: service?.image,
      vehicleId: vehicle?.id,
      vehicleBrand: vehicle?.brand,
      vehicleName: vehicle?.name,
      vehicleReg: vehicle?.regNumber,
      vehicleYear: vehicle?.year,
      vehicleFuel: vehicle?.fuel,
      vehicleImage: vehicle?.image,
      workshopId: workshop?.id,
      workshopName: workshop?.name,
      workshopAddress: workshop?.address,
      workshopDistance: workshop?.distance,
      locationType: input.draft.locationType,
      addonNames: addons.map((a) => a.name),
      paymentStatus: 'paid',
      timeline: createServiceTimeline(true),
    };

    const next = [booking, ...bookings];
    setBookings(next);
    await persistBookings(next);
    return booking;
  }, [bookings]);

  const createTestDriveBooking = useCallback(async (input: CreateTestDriveBookingInput) => {
    const booking: CustomerBooking = {
      id: `TD-${Date.now().toString().slice(-6)}`,
      type: 'test_drive',
      customerId: input.customerId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      dealerId: input.dealerId,
      status: 'pending',
      date: input.date,
      timeSlot: input.timeSlot,
      total: 0,
      createdAt: new Date().toISOString(),
      vehicleListingId: input.vehicleListingId,
      vehicleName: input.vehicleName,
      vehicleBrand: input.vehicleBrand,
      vehicleImage: input.vehicleImage,
      dealerName: input.dealerName,
      notes: input.notes,
      paymentStatus: 'paid',
      timeline: createTestDriveTimeline(),
    };

    const next = [booking, ...bookings];
    setBookings(next);
    await persistBookings(next);
    return booking;
  }, [bookings]);

  const updateBookingStatus = useCallback(async (id: string, status: BookingStatus) => {
    const next = bookings.map((b) => {
      if (b.id !== id) return b;
      return {
        ...b,
        status,
        timeline: advanceTimeline(b.timeline, status),
      };
    });
    setBookings(next);
    await persistBookings(next);
  }, [bookings]);

  const cancelBooking = useCallback(async (id: string) => {
    await updateBookingStatus(id, 'cancelled');
  }, [updateBookingStatus]);

  const getPendingServiceCount = useCallback(
    (dealerId: string) =>
      bookings.filter(
        (b) =>
          b.type === 'service' &&
          (b.dealerId === dealerId || dealerId === 'd1') &&
          (b.status === 'upcoming' || b.status === 'pending'),
      ).length,
    [bookings],
  );

  const getPendingTestDriveCount = useCallback(
    (dealerId: string) =>
      bookings.filter(
        (b) =>
          b.type === 'test_drive' &&
          (b.dealerId === dealerId || dealerId === 'd1') &&
          b.status === 'pending',
      ).length,
    [bookings],
  );

  const value = useMemo(
    () => ({
      bookings,
      isLoading,
      loadBookings,
      getCustomerBookings,
      getDealerBookings,
      getBookingById,
      createServiceBooking,
      createTestDriveBooking,
      updateBookingStatus,
      cancelBooking,
      getPendingServiceCount,
      getPendingTestDriveCount,
    }),
    [
      bookings,
      isLoading,
      loadBookings,
      getCustomerBookings,
      getDealerBookings,
      getBookingById,
      createServiceBooking,
      createTestDriveBooking,
      updateBookingStatus,
      cancelBooking,
      getPendingServiceCount,
      getPendingTestDriveCount,
    ],
  );

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
}

export function useBookings() {
  const ctx = useContext(BookingsContext);
  if (!ctx) {
    throw new Error('useBookings must be used within BookingsProvider');
  }
  return ctx;
}
