import { TestDrive } from '../../models/TestDrive';
import {
  ITestDrive,
  IUpdateTestDriveStatusRequest,
} from '../../types/testDrive/ITestDrive';
import { NotFoundError, AppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { TestDriveStatus } from '../../models/TestDrive';
import {
  enrichTestDriveLight,
  enrichTestDriveDetail,
  ITestDriveDetailEnrichment,
  ITestDriveListEnrichment,
} from '../testDrive/testDriveEnrichment';
import { notifyTestDriveStatusChange } from '../testDrive/testDriveNotificationService';

export interface IAdminTestDrive extends ITestDrive, ITestDriveListEnrichment {}

export interface IAdminTestDriveDetail extends ITestDrive, ITestDriveDetailEnrichment {}

export interface IGetAdminTestDrivesRequest {
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

export interface IAdminUpdateTestDriveRequest {
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['approved', 'rejected', 'cancelled'],
  approved: ['completed', 'cancelled'],
  rejected: [],
  completed: [],
  cancelled: [],
};

export const getAdminTestDrives = async (
  query: IGetAdminTestDrivesRequest,
): Promise<{
  testDrives: IAdminTestDrive[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> => {
  try {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.status) filter.status = query.status;
    if (query.dealerId) filter.dealerId = query.dealerId;
    if (query.userId) filter.userId = query.userId;
    if (query.vehicleId) filter.vehicleId = query.vehicleId;

    if (query.startDate || query.endDate) {
      filter.preferredDate = {};
      if (query.startDate) filter.preferredDate.$gte = new Date(query.startDate);
      if (query.endDate) filter.preferredDate.$lte = new Date(query.endDate);
    }

    const total = await TestDrive.countDocuments(filter);
    const rows = await TestDrive.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const enriched = await Promise.all(rows.map((row) => enrichTestDriveLight(row)));

    let testDrives = enriched;
    if (query.search) {
      const term = query.search.toLowerCase();
      testDrives = enriched.filter(
        (td) =>
          td.customerName?.toLowerCase().includes(term) ||
          td.dealerName?.toLowerCase().includes(term) ||
          td.vehicleLabel?.toLowerCase().includes(term) ||
          td.status.toLowerCase().includes(term),
      );
    }

    return {
      testDrives,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting admin test drives:', error);
    throw error;
  }
};

export const getAdminTestDriveById = async (testDriveId: string): Promise<IAdminTestDriveDetail> => {
  const doc = await TestDrive.findById(testDriveId).lean();
  if (!doc) {
    throw new NotFoundError('Test drive not found');
  }
  return enrichTestDriveDetail(doc);
};

export const updateAdminTestDriveStatus = async (
  testDriveId: string,
  data: IUpdateTestDriveStatusRequest,
): Promise<IAdminTestDriveDetail> => {
  const testDrive = await TestDrive.findById(testDriveId);
  if (!testDrive) {
    throw new NotFoundError('Test drive not found');
  }

  const allowed = VALID_TRANSITIONS[testDrive.status] || [];
  if (!allowed.includes(data.status)) {
    throw new AppError(`Cannot change status from ${testDrive.status} to ${data.status}`, 400);
  }

  const previousStatus = testDrive.status;
  testDrive.status = data.status;
  if (data.dealerNotes !== undefined) {
    testDrive.dealerNotes = data.dealerNotes;
  }
  await testDrive.save();

  logger.info(`Admin updated test drive ${testDriveId} to ${data.status}`);

  const notificationResult = await notifyTestDriveStatusChange({
    userId: testDrive.userId,
    testDriveId,
    vehicleId: testDrive.vehicleId,
    newStatus: data.status,
    previousStatus,
    actor: 'admin',
    preferredDate: testDrive.preferredDate.toISOString(),
    preferredTime: testDrive.preferredTime,
    dealerNotes: data.dealerNotes ?? testDrive.dealerNotes,
  });

  logger.info('Admin test drive notification dispatched', {
    testDriveId,
    userId: testDrive.userId,
    status: data.status,
    ...notificationResult,
  });

  return enrichTestDriveDetail(testDrive);
};

export const updateAdminTestDrive = async (
  testDriveId: string,
  data: IAdminUpdateTestDriveRequest,
): Promise<IAdminTestDriveDetail> => {
  const testDrive = await TestDrive.findById(testDriveId);
  if (!testDrive) {
    throw new NotFoundError('Test drive not found');
  }

  if (data.preferredDate !== undefined) {
    const preferredDate = new Date(data.preferredDate);
    if (preferredDate <= new Date()) {
      throw new AppError('Preferred date must be in the future', 400);
    }
    testDrive.preferredDate = preferredDate;
  }

  if (data.preferredTime !== undefined) {
    if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(data.preferredTime)) {
      throw new AppError('Time must be in HH:mm format', 400);
    }
    testDrive.preferredTime = data.preferredTime;
  }

  if (data.notes !== undefined) {
    testDrive.notes = data.notes;
  }

  await testDrive.save();
  logger.info(`Admin updated test drive fields: ${testDriveId}`);
  return enrichTestDriveDetail(testDrive);
};

export const deleteAdminTestDrive = async (testDriveId: string): Promise<void> => {
  const testDrive = await TestDrive.findById(testDriveId);
  if (!testDrive) {
    throw new NotFoundError('Test drive not found');
  }
  await TestDrive.findByIdAndDelete(testDriveId);
  logger.info(`Admin deleted test drive: ${testDriveId}`);
};
