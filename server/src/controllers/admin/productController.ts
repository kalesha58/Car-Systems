import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
} from '../../services/admin/productService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const getProductsController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await getProducts(req.query as any);
    res.status(200).json(result);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getProductByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const product = await getProductById(req.params.id);
    res.status(200).json(product);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const createProductController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = '691c7169e2fc47378c6ff42f';
    const product = await createProduct(req.body, userId);
    res.status(201).json(product);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateProductController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const product = await updateProduct(req.params.id, req.body);
    res.status(200).json(product);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const deleteProductController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await deleteProduct(req.params.id);
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateProductStockController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const product = await updateProductStock(req.params.id, req.body);
    res.status(200).json(product);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

