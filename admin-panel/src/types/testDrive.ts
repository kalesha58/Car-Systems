export type TestDriveStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface IAdminTestDrive {
  id: string;
  userId: string;
  vehicleId: string;
  dealerId: string;
  preferredDate: string;
  preferredTime: string;
  status: TestDriveStatus;
  notes?: string;
  dealerNotes?: string;
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  dealerName?: string;
  vehicleLabel?: string;
}

export interface IAdminTestDriveListResponse {
  testDrives: IAdminTestDrive[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IGetAdminTestDrivesParams {
  page?: number;
  limit?: number;
  status?: TestDriveStatus;
  dealerId?: string;
  userId?: string;
  vehicleId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface IUpdateAdminTestDriveStatusPayload {
  status: TestDriveStatus;
  dealerNotes?: string;
}

export interface IUpdateAdminTestDrivePayload {
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
}
