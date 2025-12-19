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
    // Since /user/dealer-vehicles/:id doesn't exist, use list endpoint with high limit
    // and filter client-side. In production, this should be a proper by-ID endpoint.
    const response = await appAxios.get<IVehiclesResponse>('/user/dealer-vehicles', {
      params: {limit: 1000},
    });
    // Find the vehicle by ID in the response
    if (response.data.success && response.data.Response?.vehicles) {
      const vehicle = response.data.Response.vehicles.find(
        (v: any) => v.id === vehicleId || v._id === vehicleId,
      );
      if (vehicle) {
        return {
          success: true,
          Response: {
            vehicles: [vehicle],
            pagination: response.data.Response.pagination,
          },
        };
      }
    }
    // If not found, return structure that will trigger 404 handling
    return {
      success: false,
      Response: {
        vehicles: [],
        pagination: {page: 1, limit: 10, total: 0, totalPages: 0},
      },
    };
  } catch (error) {
    throw error;
  }
};

