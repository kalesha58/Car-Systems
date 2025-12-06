import {appAxios} from './apiInterceptors';

export interface IDropdownOption {
  label: string;
  value: string;
}

export interface IDropdownResponse {
  vehicleTypes: IDropdownOption[];
  brands: IDropdownOption[];
  models: IDropdownOption[];
  availability: IDropdownOption[];
  fuelTypes: IDropdownOption[];
  transmission: IDropdownOption[];
  condition: IDropdownOption[];
  businessTypes: IDropdownOption[];
  categories: IDropdownOption[];
}

export interface IDropdownApiResponse {
  success: boolean;
  Response: IDropdownResponse;
}

export const getDropdownOptions = async (
  vehicleType?: string,
  brandId?: string,
): Promise<IDropdownResponse> => {
  const defaultResponse: IDropdownResponse = {
    vehicleTypes: [],
    brands: [],
    models: [],
    availability: [],
    fuelTypes: [],
    transmission: [],
    condition: [],
    businessTypes: [],
    categories: [],
  };

  try {
    const params: {vehicleType?: string; brandId?: string} = {};
    if (vehicleType) {
      params.vehicleType = vehicleType;
    }
    if (brandId) {
      params.brandId = brandId;
    }
    
    const response = await appAxios.get<IDropdownApiResponse>('/api/dropdowns', {
      params,
    });
    
    if (!response || !response.data) {
      console.warn('Dropdown API: No response data received');
      return defaultResponse;
    }
    
    const responseData = response.data;
    
    if (responseData.success && responseData.Response) {
      return responseData.Response;
    }
    
    if (responseData.Response) {
      return responseData.Response;
    }
    
    if (
      Array.isArray(responseData.vehicleTypes) ||
      Array.isArray(responseData.brands) ||
      Array.isArray(responseData.categories)
    ) {
      return responseData as IDropdownResponse;
    }
    
    console.warn('Dropdown API: Invalid response structure', responseData);
    return defaultResponse;
  } catch (error: any) {
    if (error.response) {
      console.error(
        'Error fetching dropdown options - API Error:',
        error.response.status,
        error.response.data,
      );
    } else if (error.message) {
      console.error('Error fetching dropdown options:', error.message);
    } else {
      console.error('Error fetching dropdown options:', error);
    }
    
    return defaultResponse;
  }
};

