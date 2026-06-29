import type {
  CreateVehicleRequest,
  UpdateVehicleRequest,
  UserVehicleResponse,
  UserVehiclesResponse,
} from '../types/userVehicle';

import { api } from './api';

export async function createUserVehicle(data: CreateVehicleRequest): Promise<UserVehicleResponse> {
  const response = await api.post<UserVehicleResponse>('/vehicles', data);
  return response.data;
}

export async function getUserVehicles(): Promise<UserVehiclesResponse> {
  try {
    const response = await api.get<UserVehiclesResponse>('/vehicles');
    return response.data;
  } catch (error: unknown) {
    const status =
      error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { status?: number } }).response?.status
        : undefined;
    if (status === 404) {
      return { success: true, Response: [] };
    }
    throw error;
  }
}

export async function getUserVehicleById(vehicleId: string): Promise<UserVehicleResponse> {
  const response = await api.get<UserVehicleResponse>(`/vehicles/${vehicleId}`);
  return response.data;
}

export async function updateUserVehicle(
  vehicleId: string,
  data: UpdateVehicleRequest,
): Promise<UserVehicleResponse> {
  const response = await api.put<UserVehicleResponse>(`/vehicles/${vehicleId}`, data);
  return response.data;
}

export async function deleteUserVehicle(vehicleId: string): Promise<void> {
  await api.delete(`/vehicles/${vehicleId}`);
}
