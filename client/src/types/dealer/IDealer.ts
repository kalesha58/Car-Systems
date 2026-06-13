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
  businessRegistrationId?: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  status: string;
  location?: string;
  address?: string;
  payout?: {
    type: 'UPI' | 'BANK';
    upiId?: string;
    bank?: {
      accountNumber: string;
      ifsc: string;
      accountName: string;
    };
  };
  documents?: {
    businessLicense?: string;
    taxId?: string;
    other?: string[];
  };
  createdAt: string;
  approvalCode?: string;
  dealerType?: string;
  storeOpen?: boolean;
  shopPhotos?: { url: string }[];
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

export interface IDealerByIdResponse {
  success: boolean;
  Response: IDealer;
}

export interface IDealerSnapshot {
  businessName: string;
  dealerType?: string;
  address?: string;
  businessRegistrationId?: string;
  storeOpen?: boolean;
  shopPhotos?: { url: string }[];
}

/** Parse dealer from list or single-dealer API response shapes. */
export const parseDealerResponse = (
  response: IDealerByIdResponse | IDealersResponse | null | undefined,
): IDealer | null => {
  if (!response?.success || !response.Response) {
    return null;
  }

  const payload = response.Response as IDealer & {
    dealers?: IDealer[];
  };

  if (Array.isArray(payload.dealers)) {
    return payload.dealers[0] ?? null;
  }

  if (payload.id || payload.businessName || payload.name) {
    return payload as IDealer;
  }

  return null;
};

