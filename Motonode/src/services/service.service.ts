import type {
  IGetServiceSlotsResult,
  IGetServicesRequest,
  IService,
  IServiceSlot,
  IServicesResponse,
} from '../types/service';
import { api } from './api';

export type { IService, IServiceSlot };

export async function getServices(query?: IGetServicesRequest): Promise<IServicesResponse> {
  const response = await api.get<IServicesResponse>('/services', { params: query || {} });
  return response.data;
}

export async function getServiceById(serviceId: string): Promise<IServicesResponse> {
  const response = await api.get<IServicesResponse>(`/services/${serviceId}`);
  return response.data;
}

export async function getServicesByDealerId(
  dealerId: string,
  query?: { page?: number; limit?: number },
): Promise<IServicesResponse> {
  const response = await api.get<IServicesResponse>(`/services/dealer/${dealerId}`, {
    params: query || {},
  });
  return response.data;
}

interface IGetServiceSlotsResponse {
  success: boolean;
  Response: IGetServiceSlotsResult;
}

export async function getServiceSlots(
  serviceId: string,
  date: string,
  serviceType?: 'center' | 'home',
): Promise<IGetServiceSlotsResult> {
  const params: Record<string, string> = { date };
  if (serviceType) params.serviceType = serviceType;
  const response = await api.get<IGetServiceSlotsResponse>(
    `/user/services/${serviceId}/slots`,
    { params },
  );
  if (response.data.success && response.data.Response) {
    return response.data.Response;
  }
  throw new Error('Failed to get service slots');
}

export interface IBookServiceSlotResult {
  slot: IServiceSlot;
  bookingId: string;
}

export async function bookServiceSlot(
  serviceId: string,
  slotId: string,
  body?: {
    serviceRequest?: string;
    vehicleId?: string;
    vehicleInfo?: { brand?: string; model?: string; registrationNumber?: string };
    notes?: string;
    requestLocation?: { latitude?: number; longitude?: number; address?: string };
  },
): Promise<IBookServiceSlotResult> {
  const response = await api.post<{
    success: boolean;
    Response: { slot: IServiceSlot; bookingId: string; ReturnMessage: string };
  }>(`/user/services/${serviceId}/slots/${slotId}/book`, body || {});
  if (response.data.success && response.data.Response) {
    return {
      slot: response.data.Response.slot,
      bookingId: response.data.Response.bookingId,
    };
  }
  throw new Error('Failed to book slot');
}
