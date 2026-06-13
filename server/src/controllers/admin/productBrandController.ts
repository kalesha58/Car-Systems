import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  getProductBrands,
  getProductBrandById,
  createProductBrand,
  updateProductBrand,
  deleteProductBrand,
} from '../../services/admin/productBrandService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const getProductBrandsController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const productBrands = await getProductBrands(req.query as any);
    res.status(200).json({ productBrands });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getProductBrandByIdController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const productBrand = await getProductBrandById(req.params.id);
    res.status(200).json(productBrand);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const createProductBrandController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const productBrand = await createProductBrand(req.body);
    res.status(201).json(productBrand);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateProductBrandController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const productBrand = await updateProductBrand(req.params.id, req.body);
    res.status(200).json(productBrand);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const deleteProductBrandController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    await deleteProductBrand(req.params.id);
    res.status(200).json({ success: true, message: 'Product brand deleted successfully' });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
