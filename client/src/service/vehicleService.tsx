import {appAxios} from './apiInterceptors';
import {IVehiclesResponse, IGetVehiclesRequest} from '../types/vehicle/IVehicle';

export const getDealerVehicles = async (
  query?: IGetVehiclesRequest,
): Promise<IVehiclesResponse> => {
  try {
    const params = query || {};
    const response = await appAxios.get<IVehiclesResponse>('/user/dealer-vehicles', {
      params,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getVehicleById = async (vehicleId: string): Promise<IVehiclesResponse> => {
  try {
    const response = await appAxios.get<IVehiclesResponse>(
      `/user/dealer-vehicles/${vehicleId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

