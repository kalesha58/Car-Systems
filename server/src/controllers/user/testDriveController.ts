import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { errorHandler } from '../../utils/errorHandler';
import {
  createTestDrive,
  getUserTestDrives,
  getUserTestDriveById,
  cancelUserTestDrive,
} from '../../services/user/testDriveService';
import {
  ICreateTestDriveRequest,
  IGetTestDrivesRequest,
} from '../../types/testDrive/ITestDrive';

/**
 * Create test drive request
 */
export const createTestDriveController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new Error('User not authenticated'));
    }

    const data: ICreateTestDriveRequest = req.body;
    const testDrive = await createTestDrive(userId, data);

    res.status(201).json({
      success: true,
      Response: testDrive,
    });
  } catch (error) {
    errorHandler(error as Error, res);
  }
};

/**
 * Get user's test drives
 */
export const getUserTestDrivesController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new Error('User not authenticated'));
    }

    const query: IGetTestDrivesRequest = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      status: req.query.status as any,
      vehicleId: req.query.vehicleId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const result = await getUserTestDrives(userId, query);

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as Error, res);
  }
};

/**
 * Get test drive by ID
 */
export const getUserTestDriveByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new Error('User not authenticated'));
    }

    const { id } = req.params;
    const testDrive = await getUserTestDriveById(userId, id);

    res.status(200).json({
      success: true,
      Response: testDrive,
    });
  } catch (error) {
    errorHandler(error as Error, res);
  }
};

/**
 * Cancel test drive
 */
export const cancelUserTestDriveController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new Error('User not authenticated'));
    }

    const { id } = req.params;
    const testDrive = await cancelUserTestDrive(userId, id);

    res.status(200).json({
      success: true,
      Response: testDrive,
    });
  } catch (error) {
    errorHandler(error as Error, res);
  }
};

