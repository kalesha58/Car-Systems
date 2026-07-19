import { TestDrive } from '../../models/TestDrive';
import { DealerVehicle } from '../../models/DealerVehicle';
import {
  ITestDrive,
  ICreateTestDriveRequest,
  IGetTestDrivesRequest,
} from '../../types/testDrive/ITestDrive';
import { NotFoundError, AppError, ConflictError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { IPaginationResponse } from '../../types/admin';
import {
  enrichTestDriveLight,
  enrichTestDriveDetail,
  testDriveToInterface,
  ITestDriveListEnrichment,
} from '../testDrive/testDriveEnrichment';

export interface IUserTestDrive extends ITestDrive, ITestDriveListEnrichment {}

/**
 * Create a new test drive request
 */
export const createTestDrive = async (
  userId: string,
  data: ICreateTestDriveRequest,
): Promise<ITestDrive> => {
  try {
    const vehicle = await DealerVehicle.findById(data.vehicleId);
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    if (!vehicle.allowTestDrive) {
      throw new AppError('Test drive is not available for this vehicle', 400);
    }

    if (vehicle.availability !== 'available') {
      throw new AppError('Vehicle is not available for test drive', 400);
    }

    const preferredDate = new Date(data.preferredDate);
    const now = new Date();
    if (preferredDate <= now) {
      throw new AppError('Preferred date must be in the future', 400);
    }

    const startOfDay = new Date(preferredDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(preferredDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingTestDrive = await TestDrive.findOne({
      vehicleId: data.vehicleId,
      preferredDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      preferredTime: data.preferredTime,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingTestDrive) {
      throw new ConflictError('A test drive is already scheduled for this date and time');
    }

    const testDrive = new TestDrive({
      userId,
      vehicleId: data.vehicleId,
      dealerId: vehicle.dealerId,
      preferredDate: preferredDate,
      preferredTime: data.preferredTime,
      status: 'pending',
      notes: data.notes,
    });

    await testDrive.save();

    logger.info(`Test drive created: ${testDrive._id} for vehicle: ${data.vehicleId}`);

    return testDriveToInterface(testDrive);
  } catch (error) {
    logger.error('Error creating test drive:', error);
    throw error;
  }
};

/**
 * Get user's test drives
 */
export const getUserTestDrives = async (
  userId: string,
  query: IGetTestDrivesRequest,
): Promise<{ testDrives: IUserTestDrive[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = { userId };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.vehicleId) {
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

    const enriched = await Promise.all(testDrives.map((td) => enrichTestDriveLight(td)));

    return {
      testDrives: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting user test drives:', error);
    throw error;
  }
};

/**
 * Get test drive by ID
 */
export const getUserTestDriveById = async (
  userId: string,
  testDriveId: string,
): Promise<IUserTestDrive> => {
  try {
    const testDrive = await TestDrive.findById(testDriveId);

    if (!testDrive) {
      throw new NotFoundError('Test drive not found');
    }

    if (testDrive.userId !== userId) {
      throw new AppError('Unauthorized access to test drive', 403);
    }

    return enrichTestDriveDetail(testDrive);
  } catch (error) {
    logger.error('Error getting test drive by ID:', error);
    throw error;
  }
};

/**
 * Cancel test drive (user)
 */
export const cancelUserTestDrive = async (
  userId: string,
  testDriveId: string,
): Promise<ITestDrive> => {
  try {
    const testDrive = await TestDrive.findById(testDriveId);

    if (!testDrive) {
      throw new NotFoundError('Test drive not found');
    }

    if (testDrive.userId !== userId) {
      throw new AppError('Unauthorized access to test drive', 403);
    }

    if (!['pending', 'approved'].includes(testDrive.status)) {
      throw new AppError(`Cannot cancel test drive with status: ${testDrive.status}`, 400);
    }

    testDrive.status = 'cancelled';
    await testDrive.save();

    logger.info(`Test drive cancelled: ${testDriveId} by user: ${userId}`);

    return testDriveToInterface(testDrive);
  } catch (error) {
    logger.error('Error cancelling test drive:', error);
    throw error;
  }
};
