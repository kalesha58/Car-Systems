import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  createBusinessRegistration,
  getBusinessRegistrationById,
  getBusinessRegistrationByUserId,
  updateBusinessRegistration,
  updateBusinessRegistrationStatus,
  deleteBusinessRegistration,
} from '../../services/dealer/businessRegistrationService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const createBusinessRegistrationController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const userId = req.user?.userId || '';

    const registration = await createBusinessRegistration(userId, req.body);

    res.status(201).json({
      success: true,
      Response: registration,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getBusinessRegistrationByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const registration = await getBusinessRegistrationById(req.params.id);

    res.status(200).json({
      success: true,
      Response: registration,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getBusinessRegistrationByUserIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Verify that the userId in params matches the authenticated user's userId
    // This ensures users can only check their own business registration
    // Admins can access any user's business registration
    const requestedUserId = req.params.userId;
    const authenticatedUserId = req.user?.userId;
    const isAdmin = req.user?.role?.includes('admin');

    // Allow admins to access any user's business registration
    // Regular users can only access their own
    if (!isAdmin && requestedUserId !== authenticatedUserId) {
      res.status(403).json({
        success: false,
        Response: {
          ReturnMessage: 'You can only access your own business registration',
        },
      });
      return;
    }

    const registration = await getBusinessRegistrationByUserId(requestedUserId);

    if (!registration) {
      res.status(404).json({
        success: false,
        Response: {
          ReturnMessage: 'Business registration not found',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      Response: registration,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateBusinessRegistrationController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId || '';
    const registration = await updateBusinessRegistration(req.params.id, userId, req.body);

    res.status(200).json({
      success: true,
      Response: registration,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateBusinessRegistrationStatusController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const registration = await updateBusinessRegistrationStatus(req.params.id, req.body);

    res.status(200).json({
      success: true,
      Response: registration,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const deleteBusinessRegistrationController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId || '';
    await deleteBusinessRegistration(req.params.id, userId);

    res.status(200).json({
      success: true,
      Response: {
        ReturnMessage: 'Business registration deleted successfully',
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};


