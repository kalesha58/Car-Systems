import type { DropdownApiResponse, DropdownResponse } from '../types/dropdown';

import { api } from './api';

const EMPTY_RESPONSE: DropdownResponse = {
  vehicleTypes: [],
  brands: [],
  models: [],
  availability: [],
  fuelTypes: [],
  transmission: [],
  condition: [],
  businessTypes: [],
  categories: [],
  batteryTypes: [],
  productBrands: [],
};

function normalizeDropdownResponse(data: DropdownApiResponse | DropdownResponse): DropdownResponse {
  const result = 'Response' in data && data.Response ? data.Response : (data as DropdownResponse);

  return {
    vehicleTypes: Array.isArray(result.vehicleTypes) ? result.vehicleTypes : [],
    brands: Array.isArray(result.brands) ? result.brands : [],
    models: Array.isArray(result.models) ? result.models : [],
    availability: Array.isArray(result.availability) ? result.availability : [],
    fuelTypes: Array.isArray(result.fuelTypes) ? result.fuelTypes : [],
    transmission: Array.isArray(result.transmission) ? result.transmission : [],
    condition: Array.isArray(result.condition) ? result.condition : [],
    businessTypes: Array.isArray(result.businessTypes) ? result.businessTypes : [],
    categories: Array.isArray(result.categories) ? result.categories : [],
    batteryTypes: Array.isArray(result.batteryTypes) ? result.batteryTypes : [],
    productBrands: Array.isArray(result.productBrands) ? result.productBrands : [],
  };
}

export async function getDropdownOptions(
  vehicleType?: string,
  brandId?: string,
): Promise<DropdownResponse> {
  try {
    const response = await api.get<DropdownApiResponse>('/dropdowns', {
      params: {
        ...(vehicleType ? { vehicleType } : {}),
        ...(brandId ? { brandId } : {}),
      },
    });

    if (!response.data) {
      return EMPTY_RESPONSE;
    }

    return normalizeDropdownResponse(response.data);
  } catch {
    return EMPTY_RESPONSE;
  }
}
