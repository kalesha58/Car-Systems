import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  GARAGE_VEHICLES,
  generateBookingId,
  SERVICE_ADDONS,
  SERVICE_WORKSHOPS,
  SERVICES,
  type GarageVehicle,
  type Service,
  type ServiceAddon,
  type ServiceWorkshop,
} from '@data/mockData';

export type LocationType = 'workshop' | 'pickup';
export type BookingPaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'paylater';

export interface ServiceBookingDraft {
  serviceId: string;
  date: string;
  timeSlot: string;
  vehicleId: string;
  vehicleLocked: boolean;
  locationType: LocationType;
  workshopId: string;
  selectedAddonIds: string[];
  couponCode: string;
  paymentMethod: BookingPaymentMethod;
  bookingId: string;
}

const EMPTY_DRAFT: ServiceBookingDraft = {
  serviceId: '',
  date: '',
  timeSlot: '',
  vehicleId: '',
  vehicleLocked: false,
  locationType: 'workshop',
  workshopId: '',
  selectedAddonIds: [],
  couponCode: 'HUB10',
  paymentMethod: 'upi',
  bookingId: '',
};

interface StartBookingOptions {
  vehicleId?: string;
  vehicleLocked?: boolean;
}

interface ServiceBookingContextValue {
  draft: ServiceBookingDraft;
  startBooking: (serviceId: string, options?: StartBookingOptions) => void;
  startBookingFromGarage: (vehicleId: string, serviceId?: string) => void;
  updateBooking: (patch: Partial<ServiceBookingDraft>) => void;
  resetBooking: () => void;
  confirmBooking: () => string;
  getService: () => Service | undefined;
  getVehicle: () => GarageVehicle | undefined;
  getWorkshop: () => ServiceWorkshop | undefined;
  getSelectedAddons: () => ServiceAddon[];
  getTotals: () => {
    serviceAmount: number;
    addonsAmount: number;
    couponDiscount: number;
    platformFee: number;
    total: number;
  };
}

const ServiceBookingContext = createContext<ServiceBookingContextValue | null>(null);

export function ServiceBookingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<ServiceBookingDraft>(EMPTY_DRAFT);

  const startBooking = useCallback((serviceId: string, options?: StartBookingOptions) => {
    const today = new Date();
    const defaultDate = today.toISOString().slice(0, 10);
    setDraft({
      ...EMPTY_DRAFT,
      serviceId,
      date: defaultDate,
      timeSlot: '10:00 AM',
      vehicleId: options?.vehicleId ?? GARAGE_VEHICLES[0]?.id ?? '',
      vehicleLocked: options?.vehicleLocked ?? false,
      workshopId: SERVICE_WORKSHOPS[0]?.id ?? '',
    });
  }, []);

  const startBookingFromGarage = useCallback((vehicleId: string, serviceId?: string) => {
    const defaultServiceId = serviceId ?? SERVICES[0]?.id ?? '';
    startBooking(defaultServiceId, { vehicleId, vehicleLocked: true });
  }, [startBooking]);

  const updateBooking = useCallback((patch: Partial<ServiceBookingDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetBooking = useCallback(() => {
    setDraft(EMPTY_DRAFT);
  }, []);

  const confirmBooking = useCallback(() => {
    const bookingId = generateBookingId();
    setDraft((prev) => ({ ...prev, bookingId }));
    return bookingId;
  }, []);

  const getService = useCallback(
    () => SERVICES.find((s) => s.id === draft.serviceId),
    [draft.serviceId],
  );

  const getVehicle = useCallback(
    () => GARAGE_VEHICLES.find((v) => v.id === draft.vehicleId),
    [draft.vehicleId],
  );

  const getWorkshop = useCallback(
    () => SERVICE_WORKSHOPS.find((w) => w.id === draft.workshopId),
    [draft.workshopId],
  );

  const getSelectedAddons = useCallback(
    () => SERVICE_ADDONS.filter((a) => draft.selectedAddonIds.includes(a.id)),
    [draft.selectedAddonIds],
  );

  const getTotals = useCallback(() => {
    const service = SERVICES.find((s) => s.id === draft.serviceId);
    const serviceAmount = service?.price ?? 0;
    const addonsAmount = SERVICE_ADDONS.filter((a) =>
      draft.selectedAddonIds.includes(a.id),
    ).reduce((sum, a) => sum + a.price, 0);
    const couponDiscount = draft.couponCode === 'HUB10' ? 100 : 0;
    const platformFee = 20;
    const total = serviceAmount + addonsAmount + platformFee - couponDiscount;
    return { serviceAmount, addonsAmount, couponDiscount, platformFee, total };
  }, [draft.serviceId, draft.selectedAddonIds, draft.couponCode]);

  const value = useMemo(
    () => ({
      draft,
      startBooking,
      startBookingFromGarage,
      updateBooking,
      resetBooking,
      confirmBooking,
      getService,
      getVehicle,
      getWorkshop,
      getSelectedAddons,
      getTotals,
    }),
    [
      draft,
      startBooking,
      startBookingFromGarage,
      updateBooking,
      resetBooking,
      confirmBooking,
      getService,
      getVehicle,
      getWorkshop,
      getSelectedAddons,
      getTotals,
    ],
  );

  return (
    <ServiceBookingContext.Provider value={value}>
      {children}
    </ServiceBookingContext.Provider>
  );
}

export function useServiceBooking() {
  const ctx = useContext(ServiceBookingContext);
  if (!ctx) {
    throw new Error('useServiceBooking must be used within ServiceBookingProvider');
  }
  return ctx;
}
