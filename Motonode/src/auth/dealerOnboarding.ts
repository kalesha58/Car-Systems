import type { DealerOnboardingDestination, DealerOnboardingSnapshot } from '../types/api';

import { fetchDealerOnboarding } from '../services/dealer.service';

export function resolveDealerOnboardingDestination(
  snapshot: DealerOnboardingSnapshot,
): DealerOnboardingDestination {
  if (!snapshot.hasRegistration || snapshot.status === 'rejected' || snapshot.status === null) {
    return 'DealerType';
  }

  if (snapshot.status === 'pending' || snapshot.status === 'approved') {
    return 'DealerTabs';
  }

  return 'DealerType';
}

export async function getDealerOnboardingDestination(): Promise<DealerOnboardingDestination> {
  try {
    const snapshot = await fetchDealerOnboarding();
    return resolveDealerOnboardingDestination(snapshot);
  } catch {
    return 'DealerType';
  }
}
