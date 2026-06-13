import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  getAdminTestDrives,
  getAdminTestDriveById,
  updateAdminTestDriveStatus,
  updateAdminTestDrive,
  deleteAdminTestDrive,
} from '../../services/admin/testDriveService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const getAdminTestDrivesController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const result = await getAdminTestDrives(req.query as any);
    res.status(200).json({ success: true, Response: result });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getAdminTestDriveByIdController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const testDrive = await getAdminTestDriveById(req.params.id);
    res.status(200).json({ success: true, Response: testDrive });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateAdminTestDriveStatusController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const testDrive = await updateAdminTestDriveStatus(req.params.id, req.body);
    res.status(200).json({ success: true, Response: testDrive, message: 'Test drive status updated' });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateAdminTestDriveController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const testDrive = await updateAdminTestDrive(req.params.id, req.body);
    res.status(200).json({ success: true, Response: testDrive, message: 'Test drive updated' });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const deleteAdminTestDriveController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    await deleteAdminTestDrive(req.params.id);
    res.status(200).json({ success: true, message: 'Test drive deleted successfully' });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
