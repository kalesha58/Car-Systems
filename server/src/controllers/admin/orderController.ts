import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  assignDealerToOrder,
  addTrackingInformation,
  getOrderTimeline,
  getOrderStatusLogs,
  getOrderAnalytics,
} from '../../services/admin/orderService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const getOrdersController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await getOrders(req.query as any);
    res.status(200).json(result);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getOrderByIdController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await getOrderById(req.params.id);
    res.status(200).json(order);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const createOrderController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateOrderStatusController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const adminId = req.user?.userId || 'admin';
    const order = await updateOrderStatus(req.params.id, req.body, adminId);
    res.status(200).json(order);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Force update order status (admin override)
 */
export const forceUpdateOrderStatusController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const adminId = req.user?.userId || 'admin';
    const order = await updateOrderStatus(req.params.id, req.body, adminId);
    res.status(200).json({
      success: true,
      message: 'Order status force updated',
      data: order,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const cancelOrderController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await cancelOrder(req.params.id, req.body);
    res.status(200).json(order);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const assignDealerToOrderController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const order = await assignDealerToOrder(req.params.id, req.body);
    res.status(200).json(order);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const addTrackingInformationController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const order = await addTrackingInformation(req.params.id, req.body);
    res.status(200).json({ tracking: order.tracking });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getOrderTimelineController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const timeline = await getOrderTimeline(req.params.id);
    res.status(200).json({ timeline });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get order status logs
 */
export const getOrderStatusLogsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const logs = await getOrderStatusLogs(req.params.id);
    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get order analytics
 */
export const getOrderAnalyticsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const analytics = await getOrderAnalytics(req.query as any);
    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

