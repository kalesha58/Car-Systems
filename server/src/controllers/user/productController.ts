import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { getAllProductsForUsers, getProductByIdForUsers, IGetUserProductsRequest } from '../../services/user/productService';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

/**
 * Get all products for users (marketplace)
 */
export const getAllProductsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    logger.info(`[getAllProductsController] Request received: ${req.method} ${req.originalUrl}`);
    
    const query: IGetUserProductsRequest = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      search: req.query.search as string | undefined,
      category: req.query.category as string | undefined,
      vehicleType: req.query.vehicleType as 'Car' | 'Bike' | undefined,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
    };

    const result = await getAllProductsForUsers(query);

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get product by ID for users
 */
export const getProductByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const productId = req.params.id;
    const product = await getProductByIdForUsers(productId);

    res.status(200).json({
      success: true,
      Response: product,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

