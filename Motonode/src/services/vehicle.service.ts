import type {
  IDealerVehicle,
  IGetVehiclesRequest,
  IVehiclesResponse,
} from '../types/vehicle';
import { api } from './api';

export type { IDealerVehicle };

export async function getDealerVehicles(query?: IGetVehiclesRequest): Promise<IVehiclesResponse> {
  const response = await api.get<IVehiclesResponse>('/user/dealer-vehicles', { params: query || {} });
  return response.data;
}

export async function getVehicleById(vehicleId: string): Promise<IVehiclesResponse> {
  const response = await api.get<IVehiclesResponse>('/user/dealer-vehicles', {
    params: { limit: 1000 },
  });
  if (response.data.success && response.data.Response?.vehicles) {
    const vehicle = response.data.Response.vehicles.find(
      (v) => v.id === vehicleId || (v as { _id?: string })._id === vehicleId,
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
  return {
    success: false,
    Response: {
      vehicles: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    },
  };
}
