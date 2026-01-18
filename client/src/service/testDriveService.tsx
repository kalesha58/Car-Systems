import { appAxios } from './apiInterceptors';
import {
  ITestDriveResponse,
  ITestDrivesListResponse,
  ICreateTestDriveRequest,
  IGetTestDrivesRequest,
  IUpdateTestDriveStatusRequest,
} from '../types/testDrive/ITestDrive';

/**
 * Create a test drive request
 */
export const createTestDrive = async (
  data: ICreateTestDriveRequest,
): Promise<ITestDriveResponse> => {
  try {
    const response = await appAxios.post<ITestDriveResponse>('/user/test-drives', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get user's test drives
 */
export const getUserTestDrives = async (
  query?: IGetTestDrivesRequest,
): Promise<ITestDrivesListResponse> => {
  try {
    const params = query || {};
    const response = await appAxios.get<ITestDrivesListResponse>('/user/test-drives', {
      params,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get test drive by ID
 */
export const getUserTestDriveById = async (
  testDriveId: string,
): Promise<ITestDriveResponse> => {
  try {
    const response = await appAxios.get<ITestDriveResponse>(`/user/test-drives/${testDriveId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Cancel test drive
 */
export const cancelUserTestDrive = async (
  testDriveId: string,
): Promise<ITestDriveResponse> => {
  try {
    const response = await appAxios.patch<ITestDriveResponse>(
      `/user/test-drives/${testDriveId}/cancel`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get dealer's test drives
 */
export const getDealerTestDrives = async (
  query?: IGetTestDrivesRequest,
): Promise<ITestDrivesListResponse> => {
  try {
    const params = query || {};
    const response = await appAxios.get<ITestDrivesListResponse>('/dealer/test-drives', {
      params,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get dealer test drive by ID
 */
export const getDealerTestDriveById = async (
  testDriveId: string,
): Promise<ITestDriveResponse> => {
  try {
    const response = await appAxios.get<ITestDriveResponse>(`/dealer/test-drives/${testDriveId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update test drive status (dealer)
 */
export const updateTestDriveStatus = async (
  testDriveId: string,
  data: IUpdateTestDriveStatusRequest,
): Promise<ITestDriveResponse> => {
  try {
    const response = await appAxios.patch<ITestDriveResponse>(
      `/dealer/test-drives/${testDriveId}/status`,
      data,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};












