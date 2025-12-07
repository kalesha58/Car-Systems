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
    
    const response = await appAxios.get<IDropdownApiResponse>('/dropdowns', {
      params,
    });
    
    if (!response || !response.data) {
      console.warn('Dropdown API: No response data received');
      return defaultResponse;
    }
    
    const responseData = response.data;
    
    // Check for standard response structure: { success: true, Response: {...} }
    if (responseData.success && responseData.Response) {
      const result = responseData.Response;
      
      // Ensure all arrays are defined
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
      };
    }
    
    // Fallback: Check if Response exists without success flag
    if (responseData.Response) {
      const result = responseData.Response;
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
      };
    }
    
    // Fallback: Check if data is directly in response (handle unexpected response structure)
    const directData = responseData as any;
    if (
      Array.isArray(directData.vehicleTypes) ||
      Array.isArray(directData.brands) ||
      Array.isArray(directData.categories)
    ) {
      return {
        vehicleTypes: Array.isArray(directData.vehicleTypes) ? directData.vehicleTypes : [],
        brands: Array.isArray(directData.brands) ? directData.brands : [],
        models: Array.isArray(directData.models) ? directData.models : [],
        availability: Array.isArray(directData.availability) ? directData.availability : [],
        fuelTypes: Array.isArray(directData.fuelTypes) ? directData.fuelTypes : [],
        transmission: Array.isArray(directData.transmission) ? directData.transmission : [],
        condition: Array.isArray(directData.condition) ? directData.condition : [],
        businessTypes: Array.isArray(directData.businessTypes) ? directData.businessTypes : [],
        categories: Array.isArray(directData.categories) ? directData.categories : [],
      };
    }
    
    console.warn('Dropdown API: Invalid response structure', responseData);
    return defaultResponse;
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText || 'Unknown Error';
      console.error(
        'Error fetching dropdown options - API Error:',
        status,
        statusText,
        error.response.data,
      );
      
      if (status === 404) {
        console.error('Dropdown API endpoint not found. Check if the route is properly registered on the server.');
      }
    } else if (error.message) {
      console.error('Error fetching dropdown options:', error.message);
    } else {
      console.error('Error fetching dropdown options:', error);
    }
    
    return defaultResponse;
  }
};

