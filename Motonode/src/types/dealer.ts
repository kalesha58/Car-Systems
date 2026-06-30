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

export interface IPayoutCredentials {
  type: 'UPI' | 'BANK';
  upiId?: string;
  bank?: {
    accountNumber: string;
    ifsc: string;
    accountName: string;
  };
}

export interface IBusinessRegistrationPhoto {
  url: string;
  publicId?: string;
}

export interface IBusinessRegistrationDocumentFile {
  kind: 'GST' | 'LICENSE' | 'ID' | 'PAN';
  url: string;
  publicId?: string;
  mimeType?: string;
  originalName?: string;
}

export interface IBusinessRegistration {
  id: string;
  businessName: string;
  type: string;
  address: string;
  state?: string;
  city?: string;
  phone: string;
  gst?: string;
  registrationNumber?: string;
  establishedYear?: number;
  website?: string;
  workingDays?: string;
  workingHours?: {
    open: string;
    close: string;
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  coverPhoto?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  payout?: IPayoutCredentials;
  shopPhotos?: IBusinessRegistrationPhoto[];
  documents?: IBusinessRegistrationDocumentFile[];
  status: string;
  storeOpen?: boolean;
  maxDailyBookings?: number;
  approvalCode?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IBusinessRegistrationResponse {
  success: boolean;
  Response: IBusinessRegistration;
}

export const parseDealerResponse = (
  response: IDealerByIdResponse | IDealersResponse | null | undefined,
): IDealer | null => {
  if (!response?.success || !response.Response) return null;
  const payload = response.Response as IDealer & { dealers?: IDealer[] };
  if (Array.isArray(payload.dealers)) return payload.dealers[0] ?? null;
  if (payload.id || payload.businessName || payload.name) return payload as IDealer;
  return null;
};
