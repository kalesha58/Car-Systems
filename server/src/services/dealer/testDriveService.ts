import { TestDrive, ITestDriveDocument } from '../../models/TestDrive';
import { DealerVehicle } from '../../models/DealerVehicle';
import {
  ITestDrive,
  IUpdateTestDriveStatusRequest,
  IGetTestDrivesRequest,
} from '../../types/testDrive/ITestDrive';
import { NotFoundError, AppError, ForbiddenError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { IPaginationResponse } from '../../types/admin';

/**
 * Convert test drive document to interface
 */
const testDriveToInterface = (doc: ITestDriveDocument): ITestDrive => {
  return {
    id: (doc._id as any).toString(),
    userId: doc.userId,
    vehicleId: doc.vehicleId,
    dealerId: doc.dealerId,
    preferredDate: doc.preferredDate.toISOString(),
    preferredTime: doc.preferredTime,
    status: doc.status,
    notes: doc.notes,
    dealerNotes: doc.dealerNotes,
    createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
  };
};

/**
 * Get dealer's test drives
 */
export const getDealerTestDrives = async (
  dealerId: string,
  query: IGetTestDrivesRequest,
): Promise<{ testDrives: ITestDrive[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = { dealerId };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.vehicleId) {
      // Verify vehicle belongs to dealer
      const vehicle = await DealerVehicle.findById(query.vehicleId);
      if (!vehicle || vehicle.dealerId !== dealerId) {
        throw new ForbiddenError('Vehicle does not belong to this dealer');
      }
      filter.vehicleId = query.vehicleId;
    }

    if (query.startDate || query.endDate) {
      filter.preferredDate = {};
      if (query.startDate) {
        filter.preferredDate.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.preferredDate.$lte = new Date(query.endDate);
      }
    }

    const [testDrives, total] = await Promise.all([
      TestDrive.find(filter).sort({ preferredDate: -1, preferredTime: -1 }).skip(skip).limit(limit),
      TestDrive.countDocuments(filter),
    ]);

    return {
      testDrives: testDrives.map(testDriveToInterface),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting dealer test drives:', error);
    throw error;
  }
};

/**
 * Get test drive by ID (dealer)
 */
export const getDealerTestDriveById = async (
  dealerId: string,
  testDriveId: string,
): Promise<ITestDrive> => {
  try {
    const testDrive = await TestDrive.findById(testDriveId);

    if (!testDrive) {
      throw new NotFoundError('Test drive not found');
    }

    // Ensure dealer can only access test drives for their vehicles
    if (testDrive.dealerId !== dealerId) {
      throw new ForbiddenError('Unauthorized access to test drive');
    }

    return testDriveToInterface(testDrive);
  } catch (error) {
    logger.error('Error getting test drive by ID:', error);
    throw error;
  }
};

/**
 * Update test drive status (dealer)
 */
export const updateTestDriveStatus = async (
  dealerId: string,
  testDriveId: string,
  data: IUpdateTestDriveStatusRequest,
): Promise<ITestDrive> => {
  try {
    const testDrive = await TestDrive.findById(testDriveId);

    if (!testDrive) {
      throw new NotFoundError('Test drive not found');
    }

    // Ensure dealer can only manage test drives for their vehicles
    if (testDrive.dealerId !== dealerId) {
      throw new ForbiddenError('Unauthorized access to test drive');
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ['approved', 'rejected', 'cancelled'],
      approved: ['completed', 'cancelled'],
      rejected: [],
      completed: [],
      cancelled: [],
    };

    const allowedStatuses = validTransitions[testDrive.status] || [];
    if (!allowedStatuses.includes(data.status)) {
      throw new AppError(
        `Cannot change status from ${testDrive.status} to ${data.status}`,
        400,
      );
    }

    testDrive.status = data.status;
    if (data.dealerNotes) {
      testDrive.dealerNotes = data.dealerNotes;
    }
    await testDrive.save();

    logger.info(`Test drive status updated: ${testDriveId} to ${data.status} by dealer: ${dealerId}`);

    return testDriveToInterface(testDrive);
  } catch (error) {
    logger.error('Error updating test drive status:', error);
    throw error;
  }
};



