import apiClient from './apiClient';
import type {
  IAdminTyreServiceListResponse,
  IAdminTyreServiceRequest,
  IGetAdminTyreServicesParams,
  IUpdateAdminTyreServiceStatusPayload,
} from '../types/tyreServiceRequest';

export const getAdminTyreServiceRequests = async (
  params?: IGetAdminTyreServicesParams,
): Promise<IAdminTyreServiceListResponse> => {
  const response = await apiClient.get<IAdminTyreServiceListResponse>('/admin/tyre-services', {
    params,
  });
  return response.data;
};

export const getAdminTyreServiceRequestById = async (
  id: string,
): Promise<IAdminTyreServiceRequest> => {
  const response = await apiClient.get<IAdminTyreServiceRequest>(`/admin/tyre-services/${id}`);
  return response.data;
};

export const updateAdminTyreServiceRequestStatus = async (
  id: string,
  payload: IUpdateAdminTyreServiceStatusPayload,
): Promise<IAdminTyreServiceRequest> => {
  const response = await apiClient.patch<IAdminTyreServiceRequest>(
    `/admin/tyre-services/${id}/status`,
    payload,
  );
  return response.data;
};
