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

