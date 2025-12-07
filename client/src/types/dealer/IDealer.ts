export interface IDealerInfo {
  id: string;
  businessName: string;
  type: string;
  phone: string;
  address: string;
  gst?: string;
}

export interface IDealer {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  status: string;
  location?: string;
  address?: string;
  documents?: {
    businessLicense?: string;
    taxId?: string;
    other?: string[];
  };
  createdAt: string;
  approvalCode?: string;
}

export interface IOrderStats {
  total: number;
  pending?: number;
  confirmed?: number;
  processing?: number;
  shipped?: number;
  delivered?: number;
  cancelled?: number;
  totalRevenue: number;
}

export interface IBooking {
  id: string;
  dealerId: string;
  serviceName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IGetDealersRequest {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  location?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IDealersResponse {
  success: boolean;
  Response: {
    dealers: IDealer[];
    pagination: IPaginationResponse;
  };
}

