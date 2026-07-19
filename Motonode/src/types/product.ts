import type { IDealerInfo } from './dealer';
import type { IPaginationResponse } from './dealer';

export interface IProduct {
  id: string;
  dealerId: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  stock: number;
  images: string[];
  description?: string;
  category?: string;
  vehicleType?: string;
  specifications?: Record<string, unknown>;
  tags?: string[];
  status: string;
  deliveryTimeMinutes?: number;
  returnPolicy?: string;
  isSparePart?: boolean;
  batteryTypeId?: string;
  batteryTypeName?: string;
  voltageV?: number;
  vehicleBrandId?: string;
  vehicleModelId?: string;
  vehicleBrandName?: string;
  vehicleModelName?: string;
  dealer?: IDealerInfo;
  createdAt: string;
  updatedAt: string;
  rating?: number;
  reviewCount?: number;
}

export interface IGetProductsRequest {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  categoryId?: string;
  vehicleType?: string;
  vehicleBrandId?: string;
  vehicleModelId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dealerId?: string;
}

export interface IProductsResponse {
  success: boolean;
  Response: {
    products: IProduct[];
    pagination: IPaginationResponse;
  };
}
