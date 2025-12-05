import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  getDealerOrders,
  getDealerOrderById,
  updateOrderStatus,
  cancelOrder,
  addTrackingInformation,
  getOrderTimeline,
  assignDealerToOrder,
  refundOrder,
  getDealerOrderStats,
  acceptOrder,
  rejectOrder,
  uploadOrderDocument,
} from '../../services/dealer/orderService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const getDealerOrdersController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const result = await getDealerOrders(dealerId, req.query as any);

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getDealerOrderByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const order = await getDealerOrderById(req.params.id, dealerId);

    res.status(200).json({
      success: true,
      Response: order,
    });
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
    const dealerId = (req as any).dealerId;
    const order = await updateOrderStatus(req.params.id, dealerId, req.body);

    res.status(200).json({
      success: true,
      Response: order,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const cancelOrderController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const order = await cancelOrder(req.params.id, dealerId, req.body);

    res.status(200).json({
      success: true,
      Response: order,
    });
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
    const dealerId = (req as any).dealerId;
    const order = await addTrackingInformation(req.params.id, dealerId, req.body);

    res.status(200).json({
      success: true,
      Response: order,
    });
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
    const dealerId = (req as any).dealerId;
    const timeline = await getOrderTimeline(req.params.id, dealerId);

    res.status(200).json({
      success: true,
      Response: timeline,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getOrderStatusHistoryController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Same as timeline, just different endpoint name
    const dealerId = (req as any).dealerId;
    const timeline = await getOrderTimeline(req.params.id, dealerId);

    res.status(200).json({
      success: true,
      Response: timeline,
    });
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
    const dealerId = (req as any).dealerId;
    const order = await assignDealerToOrder(req.params.id, dealerId, req.body);

    res.status(200).json({
      success: true,
      Response: order,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const refundOrderController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const order = await refundOrder(req.params.id, dealerId, req.body);

    res.status(200).json({
      success: true,
      Response: order,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getDealerOrderStatsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const stats = await getDealerOrderStats(dealerId);

    res.status(200).json({
      success: true,
      Response: stats,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const filterDealerOrdersController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Same as getDealerOrders, just different endpoint name
    const dealerId = (req as any).dealerId;
    const result = await getDealerOrders(dealerId, req.query as any);

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Accept order controller
 */
export const acceptOrderController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const order = await acceptOrder(req.params.id, dealerId);

    res.status(200).json({
      success: true,
      Response: order,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Reject order controller
 */
export const rejectOrderController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Rejection reason is required',
        },
      });
      return;
    }

    const order = await rejectOrder(req.params.id, dealerId, reason);

    res.status(200).json({
      success: true,
      Response: order,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Upload order document controller
 */
export const uploadOrderDocumentController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const { documentType, documentUrl, description, fileSize, mimeType } = req.body;

    if (!documentType || !documentUrl) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Document type and URL are required',
        },
      });
      return;
    }

    const order = await uploadOrderDocument(req.params.id, dealerId, {
      documentType,
      documentUrl,
      description,
      fileSize,
      mimeType,
    });

    res.status(200).json({
      success: true,
      Response: order,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};



