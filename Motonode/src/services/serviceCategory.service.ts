import { api } from './api';

export type ServiceTypeValue =
  | 'car_automobile'
  | 'bike_automobile'
  | 'car_wash'
  | 'tire_service'
  | 'car_detailing'
  | 'battery_service'
  | 'general';

export type ServicePackageValue = 'premium' | 'basic';
export type DeliveryModeValue = 'home' | 'store' | 'dealer_center';

export interface IServiceSubCategory {
  id: string;
  label: string;
}

export interface IServiceSection {
  id: string;
  label: string;
  serviceType: ServiceTypeValue;
  vehicleType?: 'Car' | 'Bike' | 'Both';
  hasDeliveryModes: boolean;
  deliveryModes?: Array<{ value: DeliveryModeValue; label: string }>;
  hasPackages: boolean;
  packages?: Array<{ value: ServicePackageValue; label: string }>;
  subcategories: IServiceSubCategory[];
}

export interface IServiceCategoriesResponse {
  sections: IServiceSection[];
}

export async function getServiceCategories(): Promise<IServiceCategoriesResponse> {
  try {
    const response = await api.get<{
      success?: boolean;
      Response?: IServiceCategoriesResponse;
    }>('/service-categories');
    const sections = response.data?.Response?.sections;
    return { sections: Array.isArray(sections) ? sections : [] };
  } catch {
    return { sections: [] };
  }
}
