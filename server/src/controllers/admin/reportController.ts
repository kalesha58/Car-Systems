import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { getSalesReport, getUsersReport, getProductsReport } from '../../services/admin/reportService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const getSalesReportController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const report = await getSalesReport(req.query as any);
    res.status(200).json(report);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getUsersReportController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const report = await getUsersReport(req.query as any);
    res.status(200).json(report);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getProductsReportController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const report = await getProductsReport(req.query as any);
    res.status(200).json(report);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const exportReportController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // TODO: Implement export functionality (Excel/PDF)
    res.status(501).json({ success: false, message: 'Export functionality not yet implemented' });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

