import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  getDealerVehicles,
  getDealerVehicleById,
  createDealerVehicle,
  updateDealerVehicle,
  updateVehicleAvailability,
  updateVehicleImages,
  deleteDealerVehicle,
  getAvailableDealerVehicles,
} from '../../services/dealer/vehicleService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const getDealerVehiclesController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const result = await getDealerVehicles(dealerId, req.query as any);

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getDealerVehicleByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const vehicle = await getDealerVehicleById(req.params.id, dealerId);

    res.status(200).json({
      success: true,
      Response: vehicle,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const createDealerVehicleController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const vehicle = await createDealerVehicle(dealerId, req.body);

    res.status(201).json({
      success: true,
      Response: vehicle,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateDealerVehicleController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const vehicle = await updateDealerVehicle(req.params.id, dealerId, req.body);

    res.status(200).json({
      success: true,
      Response: vehicle,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateVehicleAvailabilityController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const vehicle = await updateVehicleAvailability(req.params.id, dealerId, req.body);

    res.status(200).json({
      success: true,
      Response: vehicle,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateVehicleImagesController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const vehicle = await updateVehicleImages(req.params.id, dealerId, req.body);

    res.status(200).json({
      success: true,
      Response: vehicle,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const deleteDealerVehicleController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    await deleteDealerVehicle(req.params.id, dealerId);

    res.status(200).json({
      success: true,
      Response: {
        ReturnMessage: 'Vehicle deleted successfully',
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getAvailableDealerVehiclesController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const result = await getAvailableDealerVehicles(dealerId, req.query as any);

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const filterDealerVehiclesController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Same as getDealerVehicles, just different endpoint name
    const dealerId = (req as any).dealerId;
    const result = await getDealerVehicles(dealerId, req.query as any);

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};



