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
  DEALER_TYPE_CAPABILITIES,
  DealerCapabilities,
  DealerType,
} from '@data/dealerData';
import { StorageKeys } from '@storage/index';

interface DealerContextValue {
  dealerType: DealerType | null;
  businessProfile: BusinessProfile | null;
  registrationCompleted: boolean;
  capabilities: DealerCapabilities;
  isLoading: boolean;
  saveDealerType: (type: DealerType) => Promise<void>;
  saveBusinessProfile: (profile: BusinessProfile) => Promise<void>;
  completeRegistration: () => Promise<void>;
  resetRegistration: () => Promise<void>;
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

  const capabilities = dealerType
    ? DEALER_TYPE_CAPABILITIES[dealerType]
    : DEFAULT_CAPABILITIES;

  useEffect(() => {
    loadDealerData();
  }, []);

  async function loadDealerData() {
    try {
      const [typeStr, profileStr, regStr] = await Promise.all([
        AsyncStorage.getItem(StorageKeys.DEALER_TYPE),
        AsyncStorage.getItem(StorageKeys.BUSINESS_PROFILE),
        AsyncStorage.getItem(StorageKeys.REGISTRATION_COMPLETED),
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

  const value = useMemo(
    () => ({
      dealerType,
      businessProfile,
      registrationCompleted,
      capabilities,
      isLoading,
      saveDealerType,
      saveBusinessProfile,
      completeRegistration,
      resetRegistration,
    }),
    [
      dealerType,
      businessProfile,
      registrationCompleted,
      capabilities,
      isLoading,
      saveDealerType,
      saveBusinessProfile,
      completeRegistration,
      resetRegistration,
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
