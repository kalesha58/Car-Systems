import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from '../../services/admin/serviceService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const getServicesController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await getAllServices(req.query as any);
    res.status(200).json(result);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getServiceByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const service = await getServiceById(req.params.id);
    res.status(200).json(service);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const createServiceController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const service = await createService(req.body);
    res.status(201).json(service);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateServiceController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const service = await updateService(req.params.id, req.body);
    res.status(200).json(service);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const deleteServiceController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await deleteService(req.params.id);
    res.status(200).json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

