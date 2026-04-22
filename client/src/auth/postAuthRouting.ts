/**
 * Single place to map dealer business-registration + approval state to navigation targets.
 * Server SSOT: GET /api/dealer/me/onboarding
 *
 * Routing rule when role includes both user and dealer: dealer onboarding wins (dealer path).
 */

import { appAxios } from '@service/apiInterceptors';
import { resetAndNavigate } from '@utils/NavigationUtils';

export type DealerOnboardingScreen =
  | 'BusinessRegistration'
  | 'DealerPendingApproval'
  | 'DealerTabs';

export type DealerOnboardingSnapshot = {
  hasRegistration: boolean;
  status: 'pending' | 'approved' | 'rejected' | null;
  registrationId: string | null;
  businessName: string | null;
  businessType: string | null;
  submittedAt: string | null;
};

/** Build onboarding snapshot from POST/PUT business-registration API response (avoids race with GET /me/onboarding). */
export function registrationToOnboardingSnapshot(reg: {
  id: string;
  status: string;
  businessName?: string;
  type?: string;
  createdAt?: string;
}): DealerOnboardingSnapshot {
  const st = reg.status as DealerOnboardingSnapshot['status'];
  const normalizedStatus: DealerOnboardingSnapshot['status'] =
    st === 'pending' || st === 'approved' || st === 'rejected' ? st : null;
  return {
    hasRegistration: true,
    status: normalizedStatus,
    registrationId: reg.id,
    businessName: reg.businessName ?? null,
    businessType: reg.type ?? null,
    submittedAt: reg.createdAt ?? null,
  };
}

export function resetDealerNavigationFromRegistration(reg: Parameters<typeof registrationToOnboardingSnapshot>[0]): void {
  resetAndNavigate(resolveDealerOnboardingDestination(registrationToOnboardingSnapshot(reg)));
}

export function resolveDealerOnboardingDestination(
  snapshot: DealerOnboardingSnapshot,
): DealerOnboardingScreen {
  if (!snapshot.hasRegistration || snapshot.status === 'rejected' || snapshot.status === null) {
    return 'BusinessRegistration';
  }
  if (snapshot.status === 'pending') {
    // Keep pending dealers in the dealer dashboard flow; feature-level permissions still gate inventory actions.
    return 'DealerTabs';
  }
  if (snapshot.status === 'approved') {
    return 'DealerTabs';
  }
  return 'BusinessRegistration';
}

export async function fetchDealerMeOnboarding(): Promise<DealerOnboardingSnapshot> {
  const response = await appAxios.get<{
    success: boolean;
    Response: DealerOnboardingSnapshot;
  }>('/dealer/me/onboarding');

  if (response.data?.success && response.data.Response) {
    return response.data.Response;
  }

  return {
    hasRegistration: false,
    status: null,
    registrationId: null,
    businessName: null,
    businessType: null,
    submittedAt: null,
  };
}

/**
 * Fetch onboarding from server and reset navigation stack to the correct dealer screen.
 * On hard failure (e.g. 5xx), does not send the user to DealerTabs.
 */
export async function resetNavigationForDealerOnboarding(): Promise<void> {
  try {
    const snapshot = await fetchDealerMeOnboarding();
    const dest = resolveDealerOnboardingDestination(snapshot);
    resetAndNavigate(dest);
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 401) {
      resetAndNavigate('CustomerLogin');
      return;
    }
    if (!status || status >= 500) {
      resetAndNavigate('BusinessRegistration');
      return;
    }
    resetAndNavigate('BusinessRegistration');
  }
}
