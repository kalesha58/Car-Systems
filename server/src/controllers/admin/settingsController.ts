import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { getSettings, updateSettings } from '../../services/admin/settingsService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const getSettingsController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await getSettings();
    res.status(200).json(settings);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateSettingsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const settings = await updateSettings(req.body);
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

