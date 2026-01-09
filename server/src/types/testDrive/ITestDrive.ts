import { TestDriveStatus } from '../../models/TestDrive';

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
  preferredDate: string; // ISO date string
  preferredTime: string; // HH:mm format
  notes?: string;
}

export interface IUpdateTestDriveStatusRequest {
  status: TestDriveStatus;
  dealerNotes?: string;
}

export interface IGetTestDrivesRequest {
  page?: number;
  limit?: number;
  status?: TestDriveStatus;
  vehicleId?: string;
  startDate?: string;
  endDate?: string;
}



