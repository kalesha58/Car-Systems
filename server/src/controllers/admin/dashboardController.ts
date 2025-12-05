import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { getDashboardStats, getUsersChartData, getOrdersChartData, getOrderStatusDistribution } from '../../services/admin/dashboardService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

/**
 * Get dashboard statistics
 */
export const getDashboardStatsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const stats = await getDashboardStats();
    res.status(200).json(stats);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get users chart data
 */
export const getUsersChartDataController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const data = await getUsersChartData(startDate as string, endDate as string);
    res.status(200).json(data);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get orders chart data
 */
export const getOrdersChartDataController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const data = await getOrdersChartData(startDate as string, endDate as string);
    res.status(200).json(data);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get order status distribution
 */
export const getOrderStatusDistributionController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await getOrderStatusDistribution();
    res.status(200).json(data);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

