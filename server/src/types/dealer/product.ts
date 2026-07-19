import { ProductStatus } from '../../models/Product';

export interface IDealerProduct {
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
  vehicleType?: 'Car' | 'Bike';
  specifications?: Record<string, string>;
  returnPolicy?: string;
  tags?: string[];
  batteryTypeId?: string;
  batteryTypeName?: string;
  voltageV?: number;
  isSparePart?: boolean;
  vehicleBrandId?: string;
  vehicleModelId?: string;
  vehicleBrandName?: string;
  vehicleModelName?: string;
  status?: ProductStatus;
  returnPolicy?: string;
  deliveryTimeMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateDealerProductRequest {
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  stock: number;
  images: string[];
  description?: string;
  category?: string;
  vehicleType?: 'Car' | 'Bike';
  specifications?: Record<string, string>;
  returnPolicy?: string;
  tags?: string[];
  batteryTypeId?: string;
  voltageV?: number;
  isSparePart?: boolean;
  vehicleBrandId?: string;
  vehicleModelId?: string;
  deliveryTimeMinutes?: number;
}

export interface IUpdateDealerProductRequest {
  name?: string;
  brand?: string;
  price?: number;
  originalPrice?: number;
  discountPercentage?: number;
  stock?: number;
  images?: string[];
  description?: string;
  category?: string;
  vehicleType?: 'Car' | 'Bike';
  specifications?: Record<string, string>;
  returnPolicy?: string;
  tags?: string[];
  batteryTypeId?: string | null;
  voltageV?: number | null;
  isSparePart?: boolean;
  vehicleBrandId?: string | null;
  vehicleModelId?: string | null;
  status?: ProductStatus;
  deliveryTimeMinutes?: number | null;
}

export interface IUpdateProductStockRequest {
  stock: number;
}

export interface IUpdateProductStatusRequest {
  status: ProductStatus;
}

export interface IUpdateProductImagesRequest {
  images: string[];
}

export interface IGetDealerProductsRequest {
  page?: number;
  limit?: number;
  category?: string;
  vehicleType?: 'Car' | 'Bike';
  vehicleBrandId?: string;
  vehicleModelId?: string;
  status?: ProductStatus;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}



