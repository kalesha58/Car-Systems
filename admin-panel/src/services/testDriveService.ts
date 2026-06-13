import apiClient from './apiClient';
import type {
  IAdminTestDrive,
  IAdminTestDriveListResponse,
  IGetAdminTestDrivesParams,
  IUpdateAdminTestDrivePayload,
  IUpdateAdminTestDriveStatusPayload,
} from '../types/testDrive';

export const getAdminTestDrives = async (
  params?: IGetAdminTestDrivesParams,
): Promise<IAdminTestDriveListResponse> => {
  const response = await apiClient.get<{ success: boolean; Response?: IAdminTestDriveListResponse }>(
    '/admin/test-drives',
    { params },
  );

  if (response.data.success && response.data.Response) {
    return response.data.Response;
  }

  throw new Error('Failed to load test drives');
};

export const getAdminTestDriveById = async (id: string): Promise<IAdminTestDrive> => {
  const response = await apiClient.get<{ success: boolean; Response?: IAdminTestDrive }>(
    `/admin/test-drives/${id}`,
  );

  if (response.data.success && response.data.Response) {
    return response.data.Response;
  }

  throw new Error('Failed to load test drive');
};

export const updateAdminTestDriveStatus = async (
  id: string,
  payload: IUpdateAdminTestDriveStatusPayload,
): Promise<IAdminTestDrive> => {
  const response = await apiClient.patch<{ success: boolean; Response?: IAdminTestDrive; message?: string }>(
    `/admin/test-drives/${id}/status`,
    payload,
  );

  if (response.data.success && response.data.Response) {
    return response.data.Response;
  }

  throw new Error('Failed to update test drive status');
};

export const updateAdminTestDrive = async (
  id: string,
  payload: IUpdateAdminTestDrivePayload,
): Promise<IAdminTestDrive> => {
  const response = await apiClient.put<{ success: boolean; Response?: IAdminTestDrive; message?: string }>(
    `/admin/test-drives/${id}`,
    payload,
  );

  if (response.data.success && response.data.Response) {
    return response.data.Response;
  }

  throw new Error('Failed to update test drive');
};

export const deleteAdminTestDrive = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/test-drives/${id}`);
};
