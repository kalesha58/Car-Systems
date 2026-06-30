import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { fetchDealerOnboarding } from '@services/dealer.service';
import type { DealerOnboardingSnapshot, DealerOnboardingStatus } from '../types/api';

export function useDealerOnboardingStatus() {
  const [snapshot, setSnapshot] = useState<DealerOnboardingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchDealerOnboarding();
      setSnapshot(data);
    } catch {
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const status: DealerOnboardingStatus = snapshot?.status ?? null;
  const isApproved = status === 'approved';
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';
  const hasRegistration = snapshot?.hasRegistration ?? false;
  const canAccessDealerApis = isApproved;

  return {
    snapshot,
    loading,
    refresh,
    status,
    isApproved,
    isPending,
    isRejected,
    hasRegistration,
    canAccessDealerApis,
  };
}
