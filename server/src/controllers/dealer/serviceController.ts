import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  getDealerServices,
  getDealerServiceById,
  createDealerService,
  updateDealerService,
  updateServiceStatus,
  toggleServiceStatus,
  deleteDealerService,
  getServicesByCategory,
  getHomeServices,
  getActiveDealerServices,
  searchDealerServices,
  updateServiceImages,
} from '../../services/dealer/serviceService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const getDealerServicesController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const result = await getDealerServices(dealerId, req.query as any);

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getDealerServiceByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const service = await getDealerServiceById(req.params.id, dealerId);

    res.status(200).json({
      success: true,
      Response: service,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const createDealerServiceController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const service = await createDealerService(dealerId, req.body);

    res.status(201).json({
      success: true,
      Response: service,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateDealerServiceController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const service = await updateDealerService(req.params.id, dealerId, req.body);

    res.status(200).json({
      success: true,
      Response: service,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateServiceStatusController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const service = await updateServiceStatus(req.params.id, dealerId, req.body);

    res.status(200).json({
      success: true,
      Response: service,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const deleteDealerServiceController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    await deleteDealerService(req.params.id, dealerId);

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

export const getServicesByCategoryController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const result = await getServicesByCategory(dealerId, req.params.category, req.query as any);

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getHomeServicesController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const result = await getHomeServices(dealerId, req.query as any);

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getActiveDealerServicesController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const result = await getActiveDealerServices(dealerId, req.query as any);

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const searchDealerServicesController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const result = await searchDealerServices(dealerId, req.query as any);

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateServiceImagesController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const service = await updateServiceImages(req.params.id, dealerId, req.body);

    res.status(200).json({
      success: true,
      Response: service,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const toggleServiceStatusController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const service = await toggleServiceStatus(req.params.id, dealerId);

    res.status(200).json({
      success: true,
      Response: service,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};



