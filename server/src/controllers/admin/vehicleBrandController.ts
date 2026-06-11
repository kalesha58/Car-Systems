import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  getVehicleBrands,
  getVehicleBrandById,
  createVehicleBrand,
  updateVehicleBrand,
  deleteVehicleBrand,
} from '../../services/admin/vehicleBrandService';
import {
  getVehicleModelsByBrandId,
  createVehicleModel,
  getVehicleModelById,
  updateVehicleModel,
  deleteVehicleModel,
} from '../../services/admin/vehicleModelService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const getVehicleBrandsController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const vehicleBrands = await getVehicleBrands(req.query as any);
    res.status(200).json({ vehicleBrands });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getVehicleBrandByIdController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const vehicleBrand = await getVehicleBrandById(req.params.id);
    res.status(200).json(vehicleBrand);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const createVehicleBrandController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const vehicleBrand = await createVehicleBrand(req.body);
    res.status(201).json(vehicleBrand);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateVehicleBrandController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const vehicleBrand = await updateVehicleBrand(req.params.id, req.body);
    res.status(200).json(vehicleBrand);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const deleteVehicleBrandController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    await deleteVehicleBrand(req.params.id);
    res.status(200).json({ success: true, message: 'Vehicle brand deleted successfully' });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getVehicleModelsByBrandController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const vehicleModels = await getVehicleModelsByBrandId(req.params.brandId, req.query as any);
    res.status(200).json({ vehicleModels });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const createVehicleModelController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const vehicleModel = await createVehicleModel(req.params.brandId, req.body);
    res.status(201).json(vehicleModel);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getVehicleModelByIdController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const vehicleModel = await getVehicleModelById(req.params.id);
    res.status(200).json(vehicleModel);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateVehicleModelController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const vehicleModel = await updateVehicleModel(req.params.id, req.body);
    res.status(200).json(vehicleModel);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const deleteVehicleModelController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    await deleteVehicleModel(req.params.id);
    res.status(200).json({ success: true, message: 'Vehicle model deleted successfully' });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
