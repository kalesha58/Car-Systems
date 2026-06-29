import { api } from './api';

export interface VehicleLookupResult {
  found: boolean;
  vehicleId?: string;
  maskedPlate?: string;
}

export async function lookupVehicleByPlate(numberPlate: string): Promise<VehicleLookupResult> {
  const response = await api.post<{
    success?: boolean;
    Response: VehicleLookupResult;
  }>('/user/vehicle-alerts/lookup', {
    numberPlate: numberPlate.trim().toUpperCase(),
  });
  return response.data.Response ?? { found: false };
}
