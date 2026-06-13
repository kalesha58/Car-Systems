import apiClient from './apiClient';

export interface IBatteryType {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  sortOrder: number;
  products?: number;
  createdAt: string;
}

export interface IBatteryTypeListResponse {
  batteryTypes: IBatteryType[];
}

export interface ICreateBatteryTypePayload {
  name: string;
  status?: 'active' | 'inactive';
  sortOrder?: number;
}

export interface IUpdateBatteryTypePayload {
  name?: string;
  status?: 'active' | 'inactive';
  sortOrder?: number;
}

export const getBatteryTypes = async (params?: {
  search?: string;
  status?: string;
}): Promise<IBatteryTypeListResponse> => {
  const response = await apiClient.get<IBatteryTypeListResponse>('/admin/battery-types', { params });
  return response.data;
};

export const createBatteryType = async (payload: ICreateBatteryTypePayload): Promise<IBatteryType> => {
  const response = await apiClient.post<IBatteryType>('/admin/battery-types', payload);
  return response.data;
};

export const updateBatteryType = async (
  id: string,
  payload: IUpdateBatteryTypePayload,
): Promise<IBatteryType> => {
  const response = await apiClient.put<IBatteryType>(`/admin/battery-types/${id}`, payload);
  return response.data;
};

export const deleteBatteryType = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    `/admin/battery-types/${id}`,
  );
  return response.data;
};
