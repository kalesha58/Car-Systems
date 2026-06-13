import apiClient from './apiClient';
import type {
  IAdminTestDrive,
  IAdminTestDriveDetail,
  IAdminTestDriveListResponse,
  IGetAdminTestDrivesParams,
  IUpdateAdminTestDrivePayload,
  IUpdateAdminTestDriveStatusPayload,
} from '../types/testDrive';

export const getAdminTestDrives = async (
  params?: IGetAdminTestDrivesParams,
): Promise<IAdminTestDriveListResponse> => {
  const response = await apiClient.get<
    | { success: boolean; Response?: IAdminTestDriveListResponse }
    | IAdminTestDriveListResponse
  >('/admin/test-drives', { params });

  const data = response.data;

  if ('success' in data && data.success && data.Response) {
    return {
      testDrives: data.Response.testDrives ?? [],
      pagination: data.Response.pagination ?? {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        total: data.Response.testDrives?.length ?? 0,
        totalPages: 1,
      },
    };
  }

  if ('testDrives' in data && Array.isArray(data.testDrives)) {
    return data as IAdminTestDriveListResponse;
  }

  throw new Error('Failed to load test drives');
};

export const getAdminTestDriveById = async (id: string): Promise<IAdminTestDriveDetail> => {
  const response = await apiClient.get<{ success: boolean; Response?: IAdminTestDriveDetail }>(
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
): Promise<IAdminTestDriveDetail> => {
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
): Promise<IAdminTestDriveDetail> => {
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
