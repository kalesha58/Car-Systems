import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  createBusinessRegistration,
  getBusinessRegistrationById,
  getBusinessRegistrationByUserId,
  updateBusinessRegistration,
  updateBusinessRegistrationStatus,
  updateStoreStatus,
  deleteBusinessRegistration,
} from '../../services/dealer/businessRegistrationService';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

export const createBusinessRegistrationController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const userId = req.user?.userId || '';

    logger.info('Business registration create request received', {
      userId,
      hasShopPhotos: !!(req.body.shopPhotos && Array.isArray(req.body.shopPhotos) && req.body.shopPhotos.length > 0),
      shopPhotosCount: req.body.shopPhotos?.length || 0,
      hasDocuments: !!(req.body.documents && Array.isArray(req.body.documents) && req.body.documents.length > 0),
      documentsCount: req.body.documents?.length || 0,
      shopPhotos: req.body.shopPhotos,
      documents: req.body.documents,
    });

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
    const requestedUserId = req.params.userId;

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
    logger.info('Business registration update request received', {
      registrationId: req.params.id,
      userId,
      hasShopPhotos: !!(req.body.shopPhotos && Array.isArray(req.body.shopPhotos) && req.body.shopPhotos.length > 0),
      shopPhotosCount: req.body.shopPhotos?.length || 0,
      hasDocuments: !!(req.body.documents && Array.isArray(req.body.documents) && req.body.documents.length > 0),
      documentsCount: req.body.documents?.length || 0,
      shopPhotos: req.body.shopPhotos,
      documents: req.body.documents,
    });
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

export const updateStoreStatusController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId || '';
    const registration = await updateStoreStatus(req.params.id, userId, req.body);

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


