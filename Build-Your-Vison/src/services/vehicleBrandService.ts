import apiClient from './apiClient';

export type VehicleBrandType = 'Car' | 'Bike';

export interface IVehicleBrand {
  id: string;
  name: string;
  type: VehicleBrandType;
  status: 'active' | 'inactive';
  modelCount: number;
  createdAt: string;
}

export interface IVehicleModel {
  id: string;
  brandId: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export const getVehicleBrands = async (params?: {
  search?: string;
  status?: string;
  type?: VehicleBrandType;
}): Promise<{ vehicleBrands: IVehicleBrand[] }> => {
  const response = await apiClient.get<{ vehicleBrands: IVehicleBrand[] }>('/admin/vehicle-brands', {
    params,
  });
  return response.data;
};

export const createVehicleBrand = async (payload: {
  name: string;
  type: VehicleBrandType;
  status?: 'active' | 'inactive';
}): Promise<IVehicleBrand> => {
  const response = await apiClient.post<IVehicleBrand>('/admin/vehicle-brands', payload);
  return response.data;
};

export const updateVehicleBrand = async (
  id: string,
  payload: { name?: string; status?: 'active' | 'inactive' },
): Promise<IVehicleBrand> => {
  const response = await apiClient.put<IVehicleBrand>(`/admin/vehicle-brands/${id}`, payload);
  return response.data;
};

export const deleteVehicleBrand = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    `/admin/vehicle-brands/${id}`,
  );
  return response.data;
};

export const getVehicleModels = async (
  brandId: string,
  params?: { search?: string; status?: string },
): Promise<{ vehicleModels: IVehicleModel[] }> => {
  const response = await apiClient.get<{ vehicleModels: IVehicleModel[] }>(
    `/admin/vehicle-brands/${brandId}/models`,
    { params },
  );
  return response.data;
};

export const createVehicleModel = async (
  brandId: string,
  payload: { name: string; status?: 'active' | 'inactive' },
): Promise<IVehicleModel> => {
  const response = await apiClient.post<IVehicleModel>(
    `/admin/vehicle-brands/${brandId}/models`,
    payload,
  );
  return response.data;
};

export const updateVehicleModel = async (
  id: string,
  payload: { name?: string; status?: 'active' | 'inactive' },
): Promise<IVehicleModel> => {
  const response = await apiClient.put<IVehicleModel>(`/admin/vehicle-models/${id}`, payload);
  return response.data;
};

export const deleteVehicleModel = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    `/admin/vehicle-models/${id}`,
  );
  return response.data;
};
