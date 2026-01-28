import { CustomerEnquiryStatus } from '../../models/CustomerEnquiry';

export interface ICustomerEnquiry {
  id: string;
  userId: string;
  dealerId: string;
  vehicleId?: string;
  message: string;
  status: CustomerEnquiryStatus;
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  customerPhone?: string;
  vehicleName?: string;
}

export interface IGetDealerEnquiriesRequest {
  status?: CustomerEnquiryStatus;
  limit?: number;
  page?: number;
}

export interface IUpdateEnquiryStatusRequest {
  status: CustomerEnquiryStatus;
}

export interface IDealerEnquiriesResponse {
  enquiries: ICustomerEnquiry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
