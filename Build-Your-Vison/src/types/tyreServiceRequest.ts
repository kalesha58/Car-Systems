export type TyreServiceRequestStatus =
  | 'new'
  | 'scheduled'
  | 'in_progress'
  | 'awaiting'
  | 'completed'
  | 'cancelled';

export interface IAdminTyreServiceRequest {
  id: string;
  userId: string;
  dealerId: string;
  serviceId: string;
  bookingDate: string;
  bookingTime?: string;
  serviceRequest: string;
  status: TyreServiceRequestStatus;
  notes?: string;
  dealerNotes?: string;
  rejectionReason?: string;
  serviceSubCategory?: string;
  vehicleInfo?: {
    brand?: string;
    model?: string;
    registrationNumber?: string;
  };
  requestLocation?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  dealerName?: string;
  dealerPhone?: string;
  dealerAddress?: string;
  serviceName?: string;
  serviceType?: string;
  serviceImages?: string[];
  homeService?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAdminTyreServiceListResponse {
  requests: IAdminTyreServiceRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IGetAdminTyreServicesParams {
  page?: number;
  limit?: number;
  status?: TyreServiceRequestStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface IUpdateAdminTyreServiceStatusPayload {
  status: 'scheduled' | 'cancelled';
  dealerNotes?: string;
  rejectionReason?: string;
}
