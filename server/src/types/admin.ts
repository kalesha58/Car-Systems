import { UserRole } from "../models/SignUp";
import { IBusinessRegistration } from './dealer/businessRegistration';

// Dashboard Types
export interface IDashboardStats {
  totalUsers: number;
  totalDealers: number;
  totalOrders: number;
  totalProducts: number;
  revenue: number;
  growth: {
    users: number;
    dealers: number;
    orders: number;
    revenue: number;
  };
}

export interface IChartData {
  month: string;
  users?: number;
  orders?: number;
}

export interface IOrderStatusDistribution {
  status: string;
  count: number;
}

// User Management Types
export interface IUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  addresses?: any[];
  orders?: any[];
  vehicles?: any[];
  createdAt: string;
  role: UserRole[];
  profileImage?: string;
  isBusinessRegistration?: boolean;
  isVehicleRegistration?: boolean;
}

export interface IGetUsersRequest {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ICreateUserRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole[];
}

export interface IUpdateUserRequest {
  name?: string;
  phone?: string;
  status?: string;
  role?: UserRole[];
}

export interface IUpdateUserStatusRequest {
  status: string;
}

export interface IResetUserPasswordRequest {
  newPassword: string;
}

export interface IPaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IUserWithBusinessRegistration {
  businessRegistration: IBusinessRegistration;
  user: IUser;
}

// Dealer Management Types
export interface IDealer {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  status: string;
  location?: string;
  address?: string;
  documents?: any;
  orders?: any[];
  reviews?: any[];
  createdAt: string;
  dealerType?: string;
  suspensionReason?: string;
  registrationDate?: string;
  approvalDate?: string;

}

export interface IGetDealersRequest {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  location?: string;
  dealerType?: string;  
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ICreateDealerRequest {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  location?: string;
  address?: string;
}

export interface IUpdateDealerRequest {
  name?: string;
  businessName?: string;
  phone?: string;
  location?: string;
}

export interface IRejectDealerRequest {
  reason: string;
}

export interface ISuspendDealerRequest {
  reason: string;
}

// Product Types
export interface IProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  images: string[];
  description?: string;
  vehicleType?: string;
  tags: string[];
  specifications: Record<string, any>;
  userId: string;
  createdAt: string;
}

export interface IGetProductsRequest {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ICreateProductRequest {
  name: string;
  brand: string;
  categoryId: string;
  price: number;
  stock: number;
  description?: string;
  vehicleType?: string;
  tags?: string[];
  specifications?: Record<string, any>;
}

export interface IUpdateProductRequest {
  name?: string;
  brand?: string;
  price?: number;
  stock?: number;
  status?: string;
  description?: string;
  vehicleType?: string;
}

export interface IUpdateProductStockRequest {
  stock: number;
  operation: 'set' | 'add' | 'subtract';
}

// Category Types
export interface ICategory {
  id: string;
  name: string;
  description?: string;
  status: string;
  products?: number;
  createdAt: string;
}

export interface IGetCategoriesRequest {
  search?: string;
  status?: string;
}

export interface ICreateCategoryRequest {
  name: string;
  description?: string;
  status?: string;
}

export interface IUpdateCategoryRequest {
  name?: string;
  description?: string;
  status?: string;
}

// Order Types
export interface IOrder {
  id: string;
  orderNumber: string;
  user: any;
  dealer?: any;
  items: any[];
  subtotal: number;
  tax: number;
  shipping: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress: any;
  billingAddress: any;
  tracking?: any;
  timeline: any[];
  createdAt: string;
}

export interface IGetOrdersRequest {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  dealerId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ICreateOrderRequest {
  userId: string;
  dealerId?: string;
  items: any[];
  shippingAddress: any;
  paymentMethod: string;
}

export interface IUpdateOrderStatusRequest {
  status: string;
  notes?: string;
}

export interface ICancelOrderRequest {
  reason: string;
}

export interface IAssignDealerRequest {
  dealerId: string;
}

export interface IAddTrackingRequest {
  trackingNumber: string;
  carrier: string;
  status: string;
  estimatedDelivery?: string;
}

// Reports Types
export interface IGetSalesReportRequest {
  startDate?: string;
  endDate?: string;
  groupBy?: string;
  dealerId?: string;
}

export interface IGetUsersReportRequest {
  startDate?: string;
  endDate?: string;
  groupBy?: string;
}

export interface IGetProductsReportRequest {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
}

export interface IExportReportRequest {
  type: string;
  format: 'excel' | 'pdf';
  startDate?: string;
  endDate?: string;
}

// Settings Types
export interface ISettings {
  siteName: string;
  siteEmail: string;
  currency: string;
  taxRate: number;
  shippingCost: number;
}

export interface IUpdateSettingsRequest {
  siteName?: string;
  siteEmail?: string;
  currency?: string;
  taxRate?: number;
  shippingCost?: number;
}

// File Upload Types
export interface IUploadFileRequest {
  file: Express.Multer.File;
  type?: string;
}

