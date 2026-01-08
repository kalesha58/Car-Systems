import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { errorHandler } from '../../utils/errorHandler';
import {
  getDealerTestDrives,
  getDealerTestDriveById,
  updateTestDriveStatus,
} from '../../services/dealer/testDriveService';
import {
  IGetTestDrivesRequest,
  IUpdateTestDriveStatusRequest,
} from '../../types/testDrive/ITestDrive';

/**
 * Get dealer's test drives
 */
export const getDealerTestDrivesController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    if (!dealerId) {
      return next(new Error('Dealer ID not found'));
    }

    const query: IGetTestDrivesRequest = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      status: req.query.status as any,
      vehicleId: req.query.vehicleId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const result = await getDealerTestDrives(dealerId, query);

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
export const getDealerTestDriveByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    if (!dealerId) {
      return next(new Error('Dealer ID not found'));
    }

    const { id } = req.params;
    const testDrive = await getDealerTestDriveById(dealerId, id);

    res.status(200).json({
      success: true,
      Response: testDrive,
    });
  } catch (error) {
    errorHandler(error as Error, res);
  }
};

/**
 * Update test drive status
 */
export const updateTestDriveStatusController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    if (!dealerId) {
      return next(new Error('Dealer ID not found'));
    }

    const { id } = req.params;
    const data: IUpdateTestDriveStatusRequest = req.body;
    const testDrive = await updateTestDriveStatus(dealerId, id, data);

    res.status(200).json({
      success: true,
      Response: testDrive,
    });
  } catch (error) {
    errorHandler(error as Error, res);
  }
};

