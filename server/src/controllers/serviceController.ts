import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../middleware/authMiddleware';
import {
  getServices,
  getServiceById,
  getServicesByDealerId,
  createService,
  updateService,
  deleteService,
} from '../services/serviceService';
import { errorHandler, IAppError } from '../utils/errorHandler';

export const getServicesController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await getServices(req.query as any);
    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getServiceByIdController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const service = await getServiceById(req.params.id);
    res.status(200).json({
      success: true,
      Response: service,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getServicesByDealerIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await getServicesByDealerId(req.params.dealerId, { page, limit });
    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const createServiceController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const service = await createService(req.body);
    res.status(201).json({
      success: true,
      Response: service,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateServiceController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const service = await updateService(req.params.id, req.body);
    res.status(200).json({
      success: true,
      Response: service,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const deleteServiceController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await deleteService(req.params.id);
    res.status(200).json({
      success: true,
      Response: {
        ReturnMessage: 'Service deleted successfully',
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

