import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { IService, IServiceSlot } from '../types/service';
import type { UserVehicle } from '../types/userVehicle';
import { getServiceById, getServiceSlots, bookServiceSlot } from '../services/service.service';
import { createServiceBooking } from '../services/serviceBooking.service';
import { getUserVehicles } from '../services/userVehicle.service';
import { formatSlotTime } from '../utils/bookingMappers';

export type LocationType = 'workshop' | 'pickup';
export type BookingPaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'paylater';

export interface ServiceLocationInfo {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface ServiceBookingDraft {
  serviceId: string;
  date: string;
  timeSlot: string;
  slotId: string;
  vehicleId: string;
  vehicleLocked: boolean;
  locationType: LocationType;
  selectedAddonIds: string[];
  couponCode: string;
  paymentMethod: BookingPaymentMethod;
  bookingId: string;
  notes?: string;
  pickupAddress?: string;
}

const EMPTY_DRAFT: ServiceBookingDraft = {
  serviceId: '',
  date: '',
  timeSlot: '',
  slotId: '',
  vehicleId: '',
  vehicleLocked: false,
  locationType: 'workshop',
  selectedAddonIds: [],
  couponCode: '',
  paymentMethod: 'upi',
  bookingId: '',
};

interface StartBookingOptions {
  vehicleId?: string;
  vehicleLocked?: boolean;
}

interface ServiceBookingContextValue {
  draft: ServiceBookingDraft;
  service: IService | null;
  vehicles: UserVehicle[];
  slots: IServiceSlot[];
  slotsLoading: boolean;
  serviceLoading: boolean;
  startBooking: (serviceId: string, options?: StartBookingOptions) => Promise<void>;
  startBookingFromGarage: (vehicleId: string, serviceId?: string) => Promise<void>;
  updateBooking: (patch: Partial<ServiceBookingDraft>) => void;
  resetBooking: () => void;
  loadSlots: (date?: string) => Promise<void>;
  confirmBooking: () => Promise<string>;
  getService: () => IService | undefined;
  getVehicle: () => UserVehicle | undefined;
  getLocation: () => ServiceLocationInfo | undefined;
  getSelectedAddons: () => [];
  getTotals: () => {
    serviceAmount: number;
    addonsAmount: number;
    couponDiscount: number;
    platformFee: number;
    total: number;
  };
}

const ServiceBookingContext = createContext<ServiceBookingContextValue | null>(null);

function serviceTypeForLocation(locationType: LocationType): 'center' | 'home' {
  return locationType === 'pickup' ? 'home' : 'center';
}

export function ServiceBookingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<ServiceBookingDraft>(EMPTY_DRAFT);
  const [service, setService] = useState<IService | null>(null);
  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [slots, setSlots] = useState<IServiceSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [serviceLoading, setServiceLoading] = useState(false);

  const loadSlots = useCallback(
    async (date?: string) => {
      const serviceId = draft.serviceId;
      const slotDate = date ?? draft.date;
      if (!serviceId || !slotDate) {
        setSlots([]);
        return;
      }
      setSlotsLoading(true);
      try {
        const result = await getServiceSlots(
          serviceId,
          slotDate,
          serviceTypeForLocation(draft.locationType),
        );
        const available = (result.slots ?? []).filter((s) => s.isAvailable);
        setSlots(available);
        if (available.length > 0) {
          const first = available[0];
          setDraft((prev) => ({
            ...prev,
            timeSlot: formatSlotTime(first.startTime),
            slotId: first.id,
          }));
        } else {
          setDraft((prev) => ({ ...prev, timeSlot: '', slotId: '' }));
        }
      } catch {
        setSlots([]);
        setDraft((prev) => ({ ...prev, timeSlot: '', slotId: '' }));
      } finally {
        setSlotsLoading(false);
      }
    },
    [draft.serviceId, draft.date, draft.locationType],
  );

  const startBooking = useCallback(async (serviceId: string, options?: StartBookingOptions) => {
    const today = new Date().toISOString().slice(0, 10);
    setServiceLoading(true);
    setDraft({
      ...EMPTY_DRAFT,
      serviceId,
      date: today,
      vehicleId: options?.vehicleId ?? '',
      vehicleLocked: options?.vehicleLocked ?? false,
    });
    try {
      const [serviceRes, vehiclesRes] = await Promise.all([
        getServiceById(serviceId),
        getUserVehicles(),
      ]);
      const r = serviceRes.Response as IService | { services?: IService[] } | undefined;
      const loadedService =
        r && 'services' in r && Array.isArray(r.services)
          ? r.services[0] ?? null
          : (r as IService | undefined) ?? null;
      setService(loadedService);
      const userVehicles = vehiclesRes.Response ?? [];
      setVehicles(userVehicles);
      const defaultVehicleId = options?.vehicleId ?? userVehicles[0]?.id ?? '';
      setDraft((prev) => ({
        ...prev,
        vehicleId: defaultVehicleId,
        locationType: loadedService?.homeService ? prev.locationType : 'workshop',
      }));
    } catch {
      setService(null);
      setVehicles([]);
    } finally {
      setServiceLoading(false);
    }
  }, []);

  const startBookingFromGarage = useCallback(
    async (vehicleId: string, serviceId?: string) => {
      if (!serviceId) return;
      await startBooking(serviceId, { vehicleId, vehicleLocked: true });
    },
    [startBooking],
  );

  const updateBooking = useCallback((patch: Partial<ServiceBookingDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetBooking = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    setService(null);
    setVehicles([]);
    setSlots([]);
  }, []);

  const confirmBooking = useCallback(async () => {
    const vehicle = vehicles.find((v) => v.id === draft.vehicleId);
    const vehicleInfo = vehicle
      ? {
          brand: vehicle.brand,
          model: vehicle.model,
          registrationNumber: vehicle.numberPlate,
        }
      : undefined;

    const requestLocation =
      draft.locationType === 'pickup' && draft.pickupAddress
        ? { address: draft.pickupAddress }
        : undefined;

    let bookingId = '';

    if (draft.slotId && service?.slotBookingEnabled !== false) {
      const result = await bookServiceSlot(draft.serviceId, draft.slotId, {
        vehicleId: draft.vehicleId || undefined,
        vehicleInfo,
        notes: draft.notes,
        requestLocation,
      });
      bookingId = result.bookingId;
    } else {
      const response = await createServiceBooking({
        serviceId: draft.serviceId,
        preferredDate: draft.date,
        preferredTime: draft.timeSlot,
        notes: draft.notes,
        vehicleInfo,
        requestLocation,
      });
      bookingId = response.Response?.id ?? '';
    }

    setDraft((prev) => ({ ...prev, bookingId }));
    return bookingId;
  }, [draft, service, vehicles]);

  const getService = useCallback(() => service ?? undefined, [service]);

  const getVehicle = useCallback(
    () => vehicles.find((v) => v.id === draft.vehicleId),
    [vehicles, draft.vehicleId],
  );

  const getLocation = useCallback((): ServiceLocationInfo | undefined => {
    if (!service) return undefined;
    const dealerName = service.dealer?.businessName ?? 'Service Center';
    return {
      name: dealerName,
      address: service.location?.address ?? 'Address not available',
      latitude: service.location?.latitude,
      longitude: service.location?.longitude,
    };
  }, [service]);

  const getSelectedAddons = useCallback(() => [] as [], []);

  const getTotals = useCallback(() => {
    const serviceAmount = service?.price ?? 0;
    const addonsAmount = 0;
    const couponDiscount = 0;
    const platformFee = 0;
    const total = serviceAmount + platformFee - couponDiscount;
    return { serviceAmount, addonsAmount, couponDiscount, platformFee, total };
  }, [service]);

  const value = useMemo(
    () => ({
      draft,
      service,
      vehicles,
      slots,
      slotsLoading,
      serviceLoading,
      startBooking,
      startBookingFromGarage,
      updateBooking,
      resetBooking,
      loadSlots,
      confirmBooking,
      getService,
      getVehicle,
      getLocation,
      getSelectedAddons,
      getTotals,
    }),
    [
      draft,
      service,
      vehicles,
      slots,
      slotsLoading,
      serviceLoading,
      startBooking,
      startBookingFromGarage,
      updateBooking,
      resetBooking,
      loadSlots,
      confirmBooking,
      getService,
      getVehicle,
      getLocation,
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
