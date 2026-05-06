import { Response } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { listModerationReports, updateModerationReport } from '../../services/admin/moderationService';

export const listModerationReportsController = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const status = req.query.status as any;
    const reports = await listModerationReports(status);
    res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateModerationReportController = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const reviewerId = req.user?.userId;
    if (!reviewerId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const report = await updateModerationReport(req.params.id, reviewerId, req.body);
    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
