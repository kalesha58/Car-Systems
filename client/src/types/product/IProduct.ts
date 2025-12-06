import {IPaginationResponse} from '../dealer/IDealer';
import {IDealerInfo} from '../dealer/IDealer';

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
  vehicleType?: 'Car' | 'Bike';
  specifications?: Record<string, any>;
  tags?: string[];
  status: string;
  dealer?: IDealerInfo;
  createdAt: string;
  updatedAt: string;
  rating?: number;
  reviewCount?: number;
  quantity?: string;
  offers?: Array<{
    id: string;
    title: string;
    description: string;
    discount?: number;
  }>;
}

export interface IGetProductsRequest {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  vehicleType?: 'Car' | 'Bike';
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IProductsResponse {
  success: boolean;
  Response: {
    products: IProduct[];
    pagination: IPaginationResponse;
  };
}

