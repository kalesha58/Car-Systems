import type { DealerOnboardingSnapshot } from '../types/api';

import { api } from './api';

export interface DealerProfile {
  id: string;
  businessName: string;
}

export async function getDealerProfile(): Promise<DealerProfile> {
  const { data } = await api.get<DealerProfile>('/dealer/profile');
  return data;
}

export async function fetchDealerOnboarding(): Promise<DealerOnboardingSnapshot> {
  const response = await api.get<{
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

export async function createBusinessRegistrationApi(payload: any): Promise<any> {
  const { data } = await api.post('/dealer/business-registration', payload);
  return data;
}
