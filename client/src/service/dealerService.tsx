import {appAxios} from './apiInterceptors';
import {IDealersResponse, IGetDealersRequest} from '../types/dealer/IDealer';

export const getDealers = async (
  query?: IGetDealersRequest,
): Promise<IDealersResponse> => {
  try {
    const params = query || {};
    const response = await appAxios.get<IDealersResponse>('/dealers', {params});
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDealerById = async (dealerId: string): Promise<IDealersResponse> => {
  try {
    const response = await appAxios.get<IDealersResponse>(`/dealers/${dealerId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

