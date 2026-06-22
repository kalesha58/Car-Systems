import { appAxios } from './apiInterceptors';

export type VehicleAlertReasonCode = 'blocking' | 'wrong_parking' | 'emergency' | 'other';

export interface IVehicleAlertReason {
  code: VehicleAlertReasonCode;
  label: string;
}

export interface IVehicleLookupResult {
  found: boolean;
  vehicleId?: string;
  maskedPlate?: string;
}

export interface IVehicleAlert {
  id: string;
  reporterId: string;
  ownerId: string;
  vehicleId: string;
  numberPlate: string;
  reasonCode: VehicleAlertReasonCode;
  customMessage?: string;
  status: string;
  chatId?: string;
}

export const getVehicleAlertReasons = async (): Promise<IVehicleAlertReason[]> => {
  const response = await appAxios.get<{
    success: boolean;
    Response: { reasons: IVehicleAlertReason[] };
  }>('/user/vehicle-alerts/reasons');
  return response.data.Response?.reasons || [];
};

export const lookupVehicleByPlate = async (
  numberPlate: string,
): Promise<IVehicleLookupResult> => {
  const response = await appAxios.post<{
    success: boolean;
    Response: IVehicleLookupResult;
  }>('/user/vehicle-alerts/lookup', { numberPlate });
  return response.data.Response;
};

export const createVehicleAlert = async (data: {
  numberPlate: string;
  reasonCode: VehicleAlertReasonCode;
  customMessage?: string;
}): Promise<IVehicleAlert> => {
  const response = await appAxios.post<{
    success: boolean;
    Response: { alert: IVehicleAlert };
  }>('/user/vehicle-alerts', data);
  return response.data.Response.alert;
};

export const resolveVehicleAlert = async (alertId: string): Promise<IVehicleAlert> => {
  const response = await appAxios.patch<{
    success: boolean;
    Response: { alert: IVehicleAlert };
  }>(`/user/vehicle-alerts/${alertId}/resolve`);
  return response.data.Response.alert;
};
