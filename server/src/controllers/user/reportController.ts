import { Response } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { createContentReport } from '../../services/user/reportService';

export const createContentReportController = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const report = await createContentReport(userId, req.body);
    res.status(201).json({
      success: true,
      Response: report,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
