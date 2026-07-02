import React, { useRef, useState, type ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';

import { MobileVerificationSheet } from '@components/verification/MobileVerificationSheet';
import { CustomerStackRoutes, RootRoutes } from '@constants/routes';
import { useAuth } from '@context/AuthContext';
import { navigationRef } from '@navigation/navigationRef';
import { lightHaptic } from '@utils/haptics';

type PendingAction = () => void | Promise<void>;

interface MobileVerificationContextValue {
  runWithMobileCheck: (action: PendingAction) => Promise<void>;
  completeMobileVerification: () => Promise<void>;
  cancelMobileVerification: () => void;
}

const MobileVerificationContext = createContext<MobileVerificationContextValue | undefined>(
  undefined,
);

export function MobileVerificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [sheetVisible, setSheetVisible] = useState(false);
  const pendingActionRef = useRef<PendingAction | null>(null);
  const awaitingVerificationRef = useRef(false);

  const runPendingAction = useCallback(async () => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) {
      await action();
    }
  }, []);

  const dismissSheet = useCallback(() => {
    setSheetVisible(false);
  }, []);

  const runWithMobileCheck = useCallback(
    async (action: PendingAction) => {
      if (!user || user.isGuest || user.mobileVerified) {
        await action();
        return;
      }

      pendingActionRef.current = action;
      setSheetVisible(true);
    },
    [user],
  );

  const handleLater = useCallback(async () => {
    lightHaptic();
    dismissSheet();
    await runPendingAction();
  }, [dismissSheet, runPendingAction]);

  const handleVerifyNow = useCallback(() => {
    lightHaptic();
    awaitingVerificationRef.current = true;
    dismissSheet();

    if (navigationRef.isReady()) {
      navigationRef.navigate(RootRoutes.Customer, {
        screen: CustomerStackRoutes.OtpVerification,
        params: { phone: user?.phone ?? '' },
      });
    }
  }, [dismissSheet, user?.phone]);

  const completeMobileVerification = useCallback(async () => {
    if (!awaitingVerificationRef.current) {
      return;
    }
    awaitingVerificationRef.current = false;
    await runPendingAction();
  }, [runPendingAction]);

  const cancelMobileVerification = useCallback(() => {
    awaitingVerificationRef.current = false;
    pendingActionRef.current = null;
  }, []);

  const value = useMemo(
    () => ({
      runWithMobileCheck,
      completeMobileVerification,
      cancelMobileVerification,
    }),
    [runWithMobileCheck, completeMobileVerification, cancelMobileVerification],
  );

  return (
    <MobileVerificationContext.Provider value={value}>
      {children}
      <MobileVerificationSheet
        visible={sheetVisible}
        onVerifyNow={handleVerifyNow}
        onLater={handleLater}
        onClose={handleLater}
      />
    </MobileVerificationContext.Provider>
  );
}

export function useMobileVerificationGate(): MobileVerificationContextValue {
  const context = useContext(MobileVerificationContext);
  if (!context) {
    throw new Error('useMobileVerificationGate must be used within MobileVerificationProvider');
  }
  return context;
}
