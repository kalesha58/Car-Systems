import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  getBatteryTypes,
  getBatteryTypeById,
  createBatteryType,
  updateBatteryType,
  deleteBatteryType,
} from '../../services/admin/batteryTypeService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const getBatteryTypesController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const batteryTypes = await getBatteryTypes(req.query as any);
    res.status(200).json({ batteryTypes });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getBatteryTypeByIdController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const batteryType = await getBatteryTypeById(req.params.id);
    res.status(200).json(batteryType);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const createBatteryTypeController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const batteryType = await createBatteryType(req.body);
    res.status(201).json(batteryType);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateBatteryTypeController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const batteryType = await updateBatteryType(req.params.id, req.body);
    res.status(200).json(batteryType);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const deleteBatteryTypeController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    await deleteBatteryType(req.params.id);
    res.status(200).json({ success: true, message: 'Battery type deleted successfully' });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
