export type TestDriveStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface ITestDrive {
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
}

export interface ICreateTestDriveRequest {
  vehicleId: string;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
}

export interface IGetTestDrivesRequest {
  page?: number;
  limit?: number;
  status?: TestDriveStatus;
  vehicleId?: string;
  startDate?: string;
  endDate?: string;
}

export interface IUpdateTestDriveStatusRequest {
  status: TestDriveStatus;
  dealerNotes?: string;
}

export interface ITestDriveResponse {
  success: boolean;
  Response: ITestDrive;
}

export interface ITestDrivesListResponse {
  success: boolean;
  Response: {
    testDrives: ITestDrive[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}



