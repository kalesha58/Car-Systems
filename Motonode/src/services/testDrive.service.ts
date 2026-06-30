import type {
  ICreateTestDriveRequest,
  IGetTestDrivesRequest,
  ITestDriveResponse,
  ITestDrivesListResponse,
  IUpdateTestDriveStatusRequest,
} from '../types/testDrive';
import { api } from './api';

export type { ITestDrive } from '../types/testDrive';

export async function createTestDrive(data: ICreateTestDriveRequest): Promise<ITestDriveResponse> {
  const response = await api.post<ITestDriveResponse>('/user/test-drives', data);
  return response.data;
}

export async function getUserTestDrives(
  query?: IGetTestDrivesRequest,
): Promise<ITestDrivesListResponse> {
  const response = await api.get<ITestDrivesListResponse>('/user/test-drives', {
    params: query || {},
  });
  return response.data;
}

export async function getUserTestDriveById(testDriveId: string): Promise<ITestDriveResponse> {
  const response = await api.get<ITestDriveResponse>(`/user/test-drives/${testDriveId}`);
  return response.data;
}

export async function cancelUserTestDrive(testDriveId: string): Promise<ITestDriveResponse> {
  const response = await api.patch<ITestDriveResponse>(
    `/user/test-drives/${testDriveId}/cancel`,
  );
  return response.data;
}

export async function getDealerTestDrives(
  query?: IGetTestDrivesRequest,
): Promise<ITestDrivesListResponse> {
  const response = await api.get<ITestDrivesListResponse>('/dealer/test-drives', {
    params: query || {},
  });
  return response.data;
}

export async function getDealerTestDriveById(testDriveId: string): Promise<ITestDriveResponse> {
  const response = await api.get<ITestDriveResponse>(`/dealer/test-drives/${testDriveId}`);
  return response.data;
}

export async function updateTestDriveStatus(
  testDriveId: string,
  data: IUpdateTestDriveStatusRequest,
): Promise<ITestDriveResponse> {
  const response = await api.patch<ITestDriveResponse>(
    `/dealer/test-drives/${testDriveId}/status`,
    data,
  );
  return response.data;
}
