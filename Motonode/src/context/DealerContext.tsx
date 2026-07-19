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
  DEFAULT_DEALER_CAPABILITIES,
  DealerCapabilities,
  DealerType,
  getCapabilitiesForDealerType,
  isKnownDealerType,
} from '@data/dealerData';
import { StorageKeys } from '@storage/index';
import { fetchDealerOnboarding } from '@services/dealer.service';

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
  /** Sync dealerType from server onboarding businessType (prefer server when valid). */
  hydrateDealerTypeFromServer: () => Promise<DealerType | null>;
}

const DealerContext = createContext<DealerContextValue | undefined>(undefined);

export function DealerProvider({ children }: { children: ReactNode }) {
  const [dealerType, setDealerType] = useState<DealerType | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [registrationCompleted, setRegistrationCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const capabilities = useMemo(
    () => getCapabilitiesForDealerType(dealerType),
    [dealerType],
  );

  useEffect(() => {
    void loadDealerData();
  }, []);

  async function loadDealerData() {
    try {
      const [typeStr, profileStr, regStr] = await Promise.all([
        AsyncStorage.getItem(StorageKeys.DEALER_TYPE),
        AsyncStorage.getItem(StorageKeys.BUSINESS_PROFILE),
        AsyncStorage.getItem(StorageKeys.REGISTRATION_COMPLETED),
      ]);

      if (isKnownDealerType(typeStr)) {
        setDealerType(typeStr);
      } else if (typeStr) {
        // Stale/unknown local value — clear so we can hydrate from server
        await AsyncStorage.removeItem(StorageKeys.DEALER_TYPE);
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

  const hydrateDealerTypeFromServer = useCallback(async (): Promise<DealerType | null> => {
    try {
      const snapshot = await fetchDealerOnboarding();
      const serverType = snapshot.businessType;
      if (!isKnownDealerType(serverType)) {
        return null;
      }

      // Prefer server registration type over stale local storage
      await AsyncStorage.setItem(StorageKeys.DEALER_TYPE, serverType);
      setDealerType(serverType);
      return serverType;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      dealerType,
      businessProfile,
      registrationCompleted,
      capabilities: capabilities ?? DEFAULT_DEALER_CAPABILITIES,
      isLoading,
      saveDealerType,
      saveBusinessProfile,
      completeRegistration,
      resetRegistration,
      hydrateDealerTypeFromServer,
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
      hydrateDealerTypeFromServer,
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
