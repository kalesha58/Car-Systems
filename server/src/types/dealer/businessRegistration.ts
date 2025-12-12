import { DealerType, BusinessRegistrationStatus, IPayoutCredentials } from '../../models/BusinessRegistration';

export interface IBusinessRegistration {
  id: string;
  businessName: string;
  type: DealerType;
  address: string;
  phone: string;
  gst?: string;
  payout?: IPayoutCredentials;
  status: BusinessRegistrationStatus;
  approvalCode?: string;
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
}

export interface IUpdateBusinessRegistrationRequest {
  businessName?: string;
  type?: DealerType;
  address?: string;
  phone?: string;
  gst?: string;
  payout?: IPayoutCredentials;
}

export interface IUpdateBusinessRegistrationStatusRequest {
  status: BusinessRegistrationStatus;
  approvalCode?: string;
}



