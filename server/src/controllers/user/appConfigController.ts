import { Request, Response } from 'express';
import { getAppConfig, getVisualEffectsConfig } from '../../services/admin/settingsService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const getAppConfigController = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await getAppConfig();
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getVisualEffectsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const visualEffects = await getVisualEffectsConfig();
    res.status(200).json({ success: true, data: visualEffects });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
