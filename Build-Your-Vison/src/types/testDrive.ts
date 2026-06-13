export type TestDriveStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface ITestDriveVehicleSnapshot {
  brand: string;
  vehicleModel: string;
  year: number;
  vehicleType: string;
  images: string[];
  fuelType?: string;
  transmission?: string;
  mileage?: number;
  color?: string;
  price: number;
  availability: string;
  condition?: string;
  allowTestDrive?: boolean;
}

export interface ITestDriveDealerSnapshot {
  phone: string;
  address: string;
  type: string;
}

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
  vehicleImage?: string;
  vehicleType?: string;
}

export interface IAdminTestDriveDetail extends IAdminTestDrive {
  customerProfileImage?: string;
  customerStatus?: string;
  vehicle?: ITestDriveVehicleSnapshot;
  dealer?: ITestDriveDealerSnapshot;
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
