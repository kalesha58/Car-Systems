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
  payout?: IPayoutCredentials;
  shopPhotos?: IBusinessRegistrationPhoto[];
  documents?: IBusinessRegistrationDocumentFile[];
  status: BusinessRegistrationStatus;
  storeOpen: boolean;
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
  payout?: IPayoutCredentials;
  shopPhotos: IBusinessRegistrationPhoto[];
  documents: IBusinessRegistrationDocumentFile[];
}

export interface IUpdateBusinessRegistrationRequest {
  businessName?: string;
  type?: DealerType;
  address?: string;
  phone?: string;
  gst?: string;
  payout?: IPayoutCredentials;
  shopPhotos?: IBusinessRegistrationPhoto[];
  documents?: IBusinessRegistrationDocumentFile[];
}

export interface IUpdateBusinessRegistrationStatusRequest {
  status: BusinessRegistrationStatus;
}

export interface IUpdateStoreStatusRequest {
  storeOpen: boolean;
}



