import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  getAdminTyreServiceRequests,
  getAdminTyreServiceRequestById,
  updateAdminTyreServiceRequestStatus,
} from '../../services/admin/tyreServiceRequestService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const getAdminTyreServiceRequestsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await getAdminTyreServiceRequests(req.query as any);
    res.status(200).json(result);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getAdminTyreServiceRequestByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const request = await getAdminTyreServiceRequestById(req.params.id);
    res.status(200).json(request);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateAdminTyreServiceRequestStatusController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const request = await updateAdminTyreServiceRequestStatus(req.params.id, req.body);
    res.status(200).json(request);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
