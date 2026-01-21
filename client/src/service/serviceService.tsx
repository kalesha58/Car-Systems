import {appAxios} from './apiInterceptors';
import {IServicesResponse, IGetServicesRequest} from '../types/service/IService';

export const getServices = async (
  query?: IGetServicesRequest,
): Promise<IServicesResponse> => {
  try {
    const params = query || {};
    const response = await appAxios.get<IServicesResponse>('/services', {params});
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getServiceById = async (serviceId: string): Promise<IServicesResponse> => {
  try {
    const response = await appAxios.get<IServicesResponse>(`/services/${serviceId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getServicesByDealerId = async (
  dealerId: string,
  query?: {page?: number; limit?: number},
): Promise<IServicesResponse> => {
  try {
    const params = query || {};
    const response = await appAxios.get<IServicesResponse>(
      `/services/dealer/${dealerId}`,
      {params},
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export interface IServiceSlot {
  id: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceType: 'center' | 'home';
  maxBookings: number;
  currentBookings: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IGetServiceSlotsResponse {
  success: boolean;
  Response: {
    slots: IServiceSlot[];
  };
}

export const getServiceSlots = async (
  serviceId: string,
  date: string,
  serviceType?: 'center' | 'home',
): Promise<{ slots: IServiceSlot[] }> => {
  try {
    const params: any = { date };
    if (serviceType) {
      params.serviceType = serviceType;
    }
    const response = await appAxios.get<IGetServiceSlotsResponse>(
      `/user/services/${serviceId}/slots`,
      { params },
    );
    if (response.data.success && response.data.Response) {
      return response.data.Response;
    }
    throw new Error('Failed to get service slots');
  } catch (error) {
    throw error;
  }
};

export const bookServiceSlot = async (
  serviceId: string,
  slotId: string,
): Promise<IServiceSlot> => {
  try {
    const response = await appAxios.post<{
      success: boolean;
      Response: {
        slot: IServiceSlot;
        ReturnMessage: string;
      };
    }>(`/user/services/${serviceId}/slots/${slotId}/book`);
    if (response.data.success && response.data.Response) {
      return response.data.Response.slot;
    }
    throw new Error('Failed to book slot');
  } catch (error) {
    throw error;
  }
};
