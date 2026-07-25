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
  matchesBookingFilter,
  type BookingFilter,
  type BookingStatus,
  type CustomerBooking,
} from '@data/bookingsData';
import type { ServiceBookingDraft } from '@context/ServiceBookingContext';
import { useAuth } from '@context/AuthContext';
import {
  cancelUserServiceBooking,
  getDealerServiceBookings,
  getUserServiceBookings,
  updateServiceBookingStatus,
} from '../services/serviceBooking.service';
import {
  cancelUserTestDrive,
  createTestDrive,
  getDealerTestDrives,
  getUserTestDrives,
  updateTestDriveStatus,
} from '../services/testDrive.service';
import {
  mapServiceBookingToCustomerBooking,
  mapTestDriveToCustomerBooking,
} from '../utils/bookingMappers';
import type { ServiceBookingStatus } from '../types/serviceBooking';
import type { TestDriveStatus } from '../types/testDrive';

export interface CreateServiceBookingInput {
  draft: ServiceBookingDraft;
  bookingId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  total: number;
}

export interface CreateTestDriveBookingInput {
  vehicleId: string;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
}

interface BookingsContextValue {
  bookings: CustomerBooking[];
  dealerBookings: CustomerBooking[];
  isLoading: boolean;
  loadBookings: () => Promise<void>;
  loadDealerBookings: () => Promise<void>;
  getCustomerBookings: (customerId: string, filter?: BookingFilter) => CustomerBooking[];
  getDealerBookings: (
    filter?: BookingFilter,
    type?: CustomerBooking['type'],
  ) => CustomerBooking[];
  getBookingById: (id: string) => CustomerBooking | undefined;
  createTestDriveBooking: (input: CreateTestDriveBookingInput) => Promise<CustomerBooking>;
  updateBookingStatus: (
    id: string,
    status: BookingStatus,
    type: CustomerBooking['type'],
  ) => Promise<void>;
  cancelBooking: (id: string, type: CustomerBooking['type']) => Promise<void>;
  getPendingServiceCount: () => number;
  getPendingTestDriveCount: () => number;
}

const BookingsContext = createContext<BookingsContextValue | null>(null);

function mapDealerServiceStatus(status: BookingStatus): ServiceBookingStatus {
  const map: Partial<Record<BookingStatus, ServiceBookingStatus>> = {
    pending: 'new',
    confirmed: 'scheduled',
    in_progress: 'in_progress',
    completed: 'completed',
    cancelled: 'cancelled',
    rejected: 'cancelled',
  };
  return map[status] ?? 'new';
}

function mapDealerTestDriveStatus(status: BookingStatus): TestDriveStatus {
  const map: Partial<Record<BookingStatus, TestDriveStatus>> = {
    pending: 'pending',
    confirmed: 'approved',
    completed: 'completed',
    cancelled: 'cancelled',
    rejected: 'rejected',
  };
  return map[status] ?? 'pending';
}

export function BookingsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [dealerBookings, setDealerBookings] = useState<CustomerBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    // Guests and logged-out sessions have no JWT — skip protected endpoints.
    if (!isAuthenticated || user?.isGuest) {
      setBookings([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [testDrivesRes, serviceBookingsRes] = await Promise.all([
        getUserTestDrives({ limit: 100 }),
        getUserServiceBookings({ limit: 100 }),
      ]);
      const testDrives = testDrivesRes.Response?.testDrives ?? [];
      const serviceBookings = serviceBookingsRes.Response?.bookings ?? [];
      const mapped = [
        ...testDrives.map(mapTestDriveToCustomerBooking),
        ...serviceBookings.map(mapServiceBookingToCustomerBooking),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(mapped);
    } catch {
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.isGuest]);

  const loadDealerBookings = useCallback(async () => {
    if (!isAuthenticated || user?.isGuest || user?.role !== 'dealer') {
      setDealerBookings([]);
      return;
    }

    try {
      const [testDrivesRes, serviceBookingsRes] = await Promise.all([
        getDealerTestDrives({ limit: 100 }),
        getDealerServiceBookings({ limit: 100 }),
      ]);
      const testDrives = testDrivesRes.Response?.testDrives ?? [];
      const serviceBookings = serviceBookingsRes?.bookings ?? [];
      const mapped = [
        ...testDrives.map(mapTestDriveToCustomerBooking),
        ...serviceBookings.map(mapServiceBookingToCustomerBooking),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDealerBookings(mapped);
    } catch {
      setDealerBookings([]);
    }
  }, [isAuthenticated, user?.isGuest, user?.role]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    void loadBookings();
  }, [authLoading, loadBookings]);

  const getBookingById = useCallback(
    (id: string) =>
      bookings.find((b) => b.id === id) ?? dealerBookings.find((b) => b.id === id),
    [bookings, dealerBookings],
  );

  const getCustomerBookings = useCallback(
    (_customerId: string, filter: BookingFilter = 'all') =>
      bookings
        .filter((b) => matchesBookingFilter(b, filter))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [bookings],
  );

  const getDealerBookings = useCallback(
    (filter: BookingFilter = 'all', type?: CustomerBooking['type']) =>
      dealerBookings
        .filter((b) => (type ? b.type === type : true))
        .filter((b) => matchesBookingFilter(b, filter))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [dealerBookings],
  );

  const createTestDriveBooking = useCallback(
    async (input: CreateTestDriveBookingInput) => {
      const response = await createTestDrive({
        vehicleId: input.vehicleId,
        preferredDate: input.preferredDate,
        preferredTime: input.preferredTime,
        notes: input.notes,
      });
      const booking = mapTestDriveToCustomerBooking(response.Response);
      setBookings((prev) => [booking, ...prev]);
      return booking;
    },
    [],
  );

  const updateBookingStatus = useCallback(
    async (id: string, status: BookingStatus, type: CustomerBooking['type']) => {
      if (type === 'test_drive') {
        await updateTestDriveStatus(id, { status: mapDealerTestDriveStatus(status) });
      } else {
        await updateServiceBookingStatus(id, { status: mapDealerServiceStatus(status) });
      }
      await Promise.all([loadBookings(), loadDealerBookings()]);
    },
    [loadBookings, loadDealerBookings],
  );

  const cancelBooking = useCallback(
    async (id: string, type: CustomerBooking['type']) => {
      if (type === 'test_drive') {
        await cancelUserTestDrive(id);
      } else {
        await cancelUserServiceBooking(id);
      }
      await loadBookings();
    },
    [loadBookings],
  );

  const getPendingServiceCount = useCallback(
    () =>
      dealerBookings.filter(
        (b) => b.type === 'service' && (b.status === 'pending' || b.status === 'upcoming'),
      ).length,
    [dealerBookings],
  );

  const getPendingTestDriveCount = useCallback(
    () => dealerBookings.filter((b) => b.type === 'test_drive' && b.status === 'pending').length,
    [dealerBookings],
  );

  const value = useMemo(
    () => ({
      bookings,
      dealerBookings,
      isLoading,
      loadBookings,
      loadDealerBookings,
      getCustomerBookings,
      getDealerBookings,
      getBookingById,
      createTestDriveBooking,
      updateBookingStatus,
      cancelBooking,
      getPendingServiceCount,
      getPendingTestDriveCount,
    }),
    [
      bookings,
      dealerBookings,
      isLoading,
      loadBookings,
      loadDealerBookings,
      getCustomerBookings,
      getDealerBookings,
      getBookingById,
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
