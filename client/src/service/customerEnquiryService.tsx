import { appAxios } from './apiInterceptors';

export type CustomerEnquiryStatus = 'new' | 'responded' | 'resolved';

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

export interface IDealerEnquiriesResponse {
  success: boolean;
  Response: {
    enquiries: ICustomerEnquiry[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export const getDealerEnquiries = async (
  query?: IGetDealerEnquiriesRequest,
): Promise<{ enquiries: ICustomerEnquiry[]; pagination: any }> => {
  try {
    const params = query || {};
    const response = await appAxios.get<IDealerEnquiriesResponse>('/dealer/customer-enquiries', { params });
    if (response.data.success && response.data.Response) {
      return response.data.Response;
    }
    return { enquiries: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  } catch (error) {
    throw error;
  }
};

export interface IUpdateEnquiryStatusRequest {
  status: CustomerEnquiryStatus;
}

export const updateEnquiryStatus = async (
  enquiryId: string,
  data: IUpdateEnquiryStatusRequest,
): Promise<ICustomerEnquiry> => {
  try {
    const response = await appAxios.patch<{ success: boolean; Response: ICustomerEnquiry }>(
      `/dealer/customer-enquiries/${enquiryId}/status`,
      data,
    );
    if (response.data.success && response.data.Response) {
      return response.data.Response;
    }
    throw new Error('Failed to update enquiry status');
  } catch (error) {
    throw error;
  }
};
