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
  status?: ProductStatus;
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
  status?: ProductStatus;
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
  status?: ProductStatus;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}



