import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  BusinessProfile,
  DEALER_PRODUCTS,
  DEALER_SERVICES,
  DEALER_TYPE_CAPABILITIES,
  DEALER_VEHICLES,
  DealerCapabilities,
  DealerOrder,
  DealerProduct,
  DealerService,
  DealerType,
  DealerVehicle,
  DriveBooking,
  FULL_DEALER_ORDERS,
  FULL_DRIVE_BOOKINGS,
} from '@data/dealerData';
import { StorageKeys } from '@storage/index';

interface DealerContextValue {
  dealerType: DealerType | null;
  businessProfile: BusinessProfile | null;
  registrationCompleted: boolean;
  capabilities: DealerCapabilities;
  isLoading: boolean;
  products: DealerProduct[];
  vehicles: DealerVehicle[];
  services: DealerService[];
  orders: DealerOrder[];
  driveBookings: DriveBooking[];
  saveDealerType: (type: DealerType) => Promise<void>;
  saveBusinessProfile: (profile: BusinessProfile) => Promise<void>;
  completeRegistration: () => Promise<void>;
  resetRegistration: () => Promise<void>;
  addProduct: (product: Omit<DealerProduct, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<DealerProduct>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addVehicle: (vehicle: Omit<DealerVehicle, 'id'>) => Promise<void>;
  updateVehicle: (id: string, vehicle: Partial<DealerVehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  addService: (service: Omit<DealerService, 'id'>) => Promise<void>;
  updateService: (id: string, service: Partial<DealerService>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, status: DealerOrder['status']) => Promise<void>;
  updateBookingStatus: (id: string, status: DriveBooking['status']) => Promise<void>;
}

const DEFAULT_CAPABILITIES: DealerCapabilities = {
  hasProducts: true,
  hasVehicles: false,
  hasServices: false,
  hasDrive: false,
};

const DealerContext = createContext<DealerContextValue | undefined>(undefined);

export function DealerProvider({ children }: { children: ReactNode }) {
  const [dealerType, setDealerType] = useState<DealerType | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [registrationCompleted, setRegistrationCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<DealerProduct[]>(DEALER_PRODUCTS);
  const [vehicles, setVehicles] = useState<DealerVehicle[]>(DEALER_VEHICLES);
  const [services, setServices] = useState<DealerService[]>(DEALER_SERVICES);
  const [orders, setOrders] = useState<DealerOrder[]>(FULL_DEALER_ORDERS);
  const [driveBookings, setDriveBookings] = useState<DriveBooking[]>(FULL_DRIVE_BOOKINGS);

  const capabilities = dealerType
    ? DEALER_TYPE_CAPABILITIES[dealerType]
    : DEFAULT_CAPABILITIES;

  useEffect(() => {
    loadDealerData();
  }, []);

  async function loadDealerData() {
    try {
      const [
        typeStr,
        profileStr,
        regStr,
        productsStr,
        vehiclesStr,
        servicesStr,
        ordersStr,
        bookingsStr,
      ] = await Promise.all([
        AsyncStorage.getItem(StorageKeys.DEALER_TYPE),
        AsyncStorage.getItem(StorageKeys.BUSINESS_PROFILE),
        AsyncStorage.getItem(StorageKeys.REGISTRATION_COMPLETED),
        AsyncStorage.getItem(StorageKeys.DEALER_PRODUCTS),
        AsyncStorage.getItem(StorageKeys.DEALER_VEHICLES),
        AsyncStorage.getItem(StorageKeys.DEALER_SERVICES),
        AsyncStorage.getItem(StorageKeys.DEALER_ORDERS),
        AsyncStorage.getItem(StorageKeys.DRIVE_BOOKINGS),
      ]);

      if (typeStr) {
        setDealerType(typeStr as DealerType);
      }
      if (profileStr) {
        setBusinessProfile(JSON.parse(profileStr));
      }
      if (regStr) {
        setRegistrationCompleted(regStr === 'true');
      }
      if (productsStr) {
        setProducts(JSON.parse(productsStr));
      }
      if (vehiclesStr) {
        setVehicles(JSON.parse(vehiclesStr));
      }
      if (servicesStr) {
        setServices(JSON.parse(servicesStr));
      }
      if (ordersStr) {
        setOrders(JSON.parse(ordersStr));
      }
      if (bookingsStr) {
        setDriveBookings(JSON.parse(bookingsStr));
      }
    } finally {
      setIsLoading(false);
    }
  }

  const saveDealerType = useCallback(async (type: DealerType) => {
    await AsyncStorage.setItem(StorageKeys.DEALER_TYPE, type);
    setDealerType(type);
  }, []);

  const saveBusinessProfile = useCallback(async (profile: BusinessProfile) => {
    await AsyncStorage.setItem(StorageKeys.BUSINESS_PROFILE, JSON.stringify(profile));
    setBusinessProfile(profile);
  }, []);

  const completeRegistration = useCallback(async () => {
    await AsyncStorage.setItem(StorageKeys.REGISTRATION_COMPLETED, 'true');
    setRegistrationCompleted(true);
  }, []);

  const resetRegistration = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(StorageKeys.DEALER_TYPE),
      AsyncStorage.removeItem(StorageKeys.BUSINESS_PROFILE),
      AsyncStorage.removeItem(StorageKeys.REGISTRATION_COMPLETED),
    ]);
    setDealerType(null);
    setBusinessProfile(null);
    setRegistrationCompleted(false);
  }, []);

  const addProduct = useCallback(
    async (product: Omit<DealerProduct, 'id'>) => {
      const newProduct: DealerProduct = { ...product, id: `dp${Date.now()}` };
      const updated = [newProduct, ...products];
      setProducts(updated);
      await AsyncStorage.setItem(StorageKeys.DEALER_PRODUCTS, JSON.stringify(updated));
    },
    [products],
  );

  const updateProduct = useCallback(
    async (id: string, patch: Partial<DealerProduct>) => {
      const updated = products.map(p => (p.id === id ? { ...p, ...patch } : p));
      setProducts(updated);
      await AsyncStorage.setItem(StorageKeys.DEALER_PRODUCTS, JSON.stringify(updated));
    },
    [products],
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      await AsyncStorage.setItem(StorageKeys.DEALER_PRODUCTS, JSON.stringify(updated));
    },
    [products],
  );

  const addVehicle = useCallback(
    async (vehicle: Omit<DealerVehicle, 'id'>) => {
      const newVehicle: DealerVehicle = { ...vehicle, id: `dv${Date.now()}` };
      const updated = [newVehicle, ...vehicles];
      setVehicles(updated);
      await AsyncStorage.setItem(StorageKeys.DEALER_VEHICLES, JSON.stringify(updated));
    },
    [vehicles],
  );

  const updateVehicle = useCallback(
    async (id: string, patch: Partial<DealerVehicle>) => {
      const updated = vehicles.map(v => (v.id === id ? { ...v, ...patch } : v));
      setVehicles(updated);
      await AsyncStorage.setItem(StorageKeys.DEALER_VEHICLES, JSON.stringify(updated));
    },
    [vehicles],
  );

  const deleteVehicle = useCallback(
    async (id: string) => {
      const updated = vehicles.filter(v => v.id !== id);
      setVehicles(updated);
      await AsyncStorage.setItem(StorageKeys.DEALER_VEHICLES, JSON.stringify(updated));
    },
    [vehicles],
  );

  const addService = useCallback(
    async (service: Omit<DealerService, 'id'>) => {
      const newService: DealerService = { ...service, id: `ds${Date.now()}` };
      const updated = [newService, ...services];
      setServices(updated);
      await AsyncStorage.setItem(StorageKeys.DEALER_SERVICES, JSON.stringify(updated));
    },
    [services],
  );

  const updateService = useCallback(
    async (id: string, patch: Partial<DealerService>) => {
      const updated = services.map(s => (s.id === id ? { ...s, ...patch } : s));
      setServices(updated);
      await AsyncStorage.setItem(StorageKeys.DEALER_SERVICES, JSON.stringify(updated));
    },
    [services],
  );

  const deleteService = useCallback(
    async (id: string) => {
      const updated = services.filter(s => s.id !== id);
      setServices(updated);
      await AsyncStorage.setItem(StorageKeys.DEALER_SERVICES, JSON.stringify(updated));
    },
    [services],
  );

  const updateOrderStatus = useCallback(
    async (id: string, status: DealerOrder['status']) => {
      const updated = orders.map(o => (o.id === id ? { ...o, status } : o));
      setOrders(updated);
      await AsyncStorage.setItem(StorageKeys.DEALER_ORDERS, JSON.stringify(updated));
    },
    [orders],
  );

  const updateBookingStatus = useCallback(
    async (id: string, status: DriveBooking['status']) => {
      const updated = driveBookings.map(b => (b.id === id ? { ...b, status } : b));
      setDriveBookings(updated);
      await AsyncStorage.setItem(StorageKeys.DRIVE_BOOKINGS, JSON.stringify(updated));
    },
    [driveBookings],
  );

  const value = useMemo(
    () => ({
      dealerType,
      businessProfile,
      registrationCompleted,
      capabilities,
      isLoading,
      products,
      vehicles,
      services,
      orders,
      driveBookings,
      saveDealerType,
      saveBusinessProfile,
      completeRegistration,
      resetRegistration,
      addProduct,
      updateProduct,
      deleteProduct,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      addService,
      updateService,
      deleteService,
      updateOrderStatus,
      updateBookingStatus,
    }),
    [
      dealerType,
      businessProfile,
      registrationCompleted,
      capabilities,
      isLoading,
      products,
      vehicles,
      services,
      orders,
      driveBookings,
      saveDealerType,
      saveBusinessProfile,
      completeRegistration,
      resetRegistration,
      addProduct,
      updateProduct,
      deleteProduct,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      addService,
      updateService,
      deleteService,
      updateOrderStatus,
      updateBookingStatus,
    ],
  );

  return <DealerContext.Provider value={value}>{children}</DealerContext.Provider>;
}

export function useDealer(): DealerContextValue {
  const ctx = useContext(DealerContext);
  if (!ctx) {
    throw new Error('useDealer must be used inside DealerProvider');
  }
  return ctx;
}
