import { api } from './api';

export interface DealerProfile {
  id: string;
  businessName: string;
}

export async function getDealerProfile(): Promise<DealerProfile> {
  const { data } = await api.get<DealerProfile>('/dealer/profile');
  return data;
}
