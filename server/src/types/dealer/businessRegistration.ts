import { DealerType, BusinessRegistrationStatus, IPayoutCredentials } from '../../models/BusinessRegistration';

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
  type: DealerType;
  address: string;
  phone: string;
  gst?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  payout?: IPayoutCredentials;
  coverPhoto?: string;
  shopPhotos?: IBusinessRegistrationPhoto[];
  documents?: IBusinessRegistrationDocumentFile[];
  status: BusinessRegistrationStatus;
  storeOpen: boolean;
  maxDailyBookings?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateBusinessRegistrationRequest {
  businessName: string;
  type: DealerType;
  address: string;
  phone: string;
  gst?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  payout?: IPayoutCredentials;
  coverPhoto?: string;
  shopPhotos: IBusinessRegistrationPhoto[];
  documents: IBusinessRegistrationDocumentFile[];
  maxDailyBookings?: number;
}

export interface IUpdateBusinessRegistrationRequest {
  businessName?: string;
  type?: DealerType;
  address?: string;
  phone?: string;
  gst?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  payout?: IPayoutCredentials;
  coverPhoto?: string;
  shopPhotos?: IBusinessRegistrationPhoto[];
  documents?: IBusinessRegistrationDocumentFile[];
  maxDailyBookings?: number | null;
}

export interface IUpdateBusinessRegistrationStatusRequest {
  status: BusinessRegistrationStatus;
}

export interface IUpdateStoreStatusRequest {
  storeOpen: boolean;
}

export interface IUpdateBookingSettingsRequest {
  maxDailyBookings?: number | null;
}



