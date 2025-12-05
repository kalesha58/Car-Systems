import { Response, NextFunction } from 'express';
import {
  createVehicle,
  getVehiclesByOwner,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getAllDealerVehiclesForUsers,
} from '../../services/user/vehicleService';
import { ICreateVehicleRequest, IUpdateVehicleRequest } from '../../types/vehicle';
import { IGetUserDealerVehiclesRequest } from '../../types/user/vehicle';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { logger } from '../../utils/logger';

/**
 * Create vehicle controller
 */
export const createVehicleController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ownerId = req.user?.userId;

    if (!ownerId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const vehicleData: ICreateVehicleRequest = req.body;
    const result = await createVehicle(ownerId, vehicleData);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get all vehicles by owner controller
 */
export const getVehiclesController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ownerId = req.user?.userId;

    if (!ownerId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const result = await getVehiclesByOwner(ownerId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get vehicle by ID controller
 */
export const getVehicleByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ownerId = req.user?.userId;
    const vehicleId = req.params.id;

    if (!ownerId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const result = await getVehicleById(vehicleId, ownerId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Update vehicle controller
 */
export const updateVehicleController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ownerId = req.user?.userId;
    const vehicleId = req.params.id;

    if (!ownerId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const vehicleData: IUpdateVehicleRequest = req.body;
    const result = await updateVehicle(vehicleId, ownerId, vehicleData);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Delete vehicle controller
 */
export const deleteVehicleController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ownerId = req.user?.userId;
    const vehicleId = req.params.id;

    if (!ownerId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    await deleteVehicle(vehicleId, ownerId);

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

/**
 * Get all dealer vehicles for users controller
 */
export const getAllDealerVehiclesForUsersController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    logger.info(`[getAllDealerVehiclesForUsersController] Request received: ${req.method} ${req.originalUrl}`);

    const query: IGetUserDealerVehiclesRequest = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      vehicleType: req.query.vehicleType as 'Car' | 'Bike' | undefined,
      brand: req.query.brand as string | undefined,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      minYear: req.query.minYear ? parseInt(req.query.minYear as string, 10) : undefined,
      maxYear: req.query.maxYear ? parseInt(req.query.maxYear as string, 10) : undefined,
      search: req.query.search as string | undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
    };

    const result = await getAllDealerVehiclesForUsers(query);

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

