import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  getDealerProducts,
  getDealerProductById,
  createDealerProduct,
  updateDealerProduct,
  updateProductStock,
  updateProductStatus,
  updateProductImages,
  deleteDealerProduct,
  getProductsByCategory,
  getProductsByVehicleType,
} from '../../services/dealer/productService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const getDealerProductsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const result = await getDealerProducts(dealerId, req.query as any);

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getDealerProductByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const product = await getDealerProductById(req.params.id, dealerId);

    res.status(200).json({
      success: true,
      Response: product,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const createDealerProductController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const product = await createDealerProduct(dealerId, req.body);

    res.status(201).json({
      success: true,
      Response: product,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateDealerProductController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const product = await updateDealerProduct(req.params.id, dealerId, req.body);

    res.status(200).json({
      success: true,
      Response: product,
    });
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
    const dealerId = (req as any).dealerId;
    const product = await updateProductStock(req.params.id, dealerId, req.body);

    res.status(200).json({
      success: true,
      Response: product,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateProductStatusController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const product = await updateProductStatus(req.params.id, dealerId, req.body);

    res.status(200).json({
      success: true,
      Response: product,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateProductImagesController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const product = await updateProductImages(req.params.id, dealerId, req.body);

    res.status(200).json({
      success: true,
      Response: product,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const deleteDealerProductController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    await deleteDealerProduct(req.params.id, dealerId);

    res.status(200).json({
      success: true,
      Response: {
        ReturnMessage: 'Product deleted successfully',
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getProductsByCategoryController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const result = await getProductsByCategory(dealerId, req.params.category, req.query as any);

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getProductsByVehicleTypeController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as any).dealerId;
    const result = await getProductsByVehicleType(
      dealerId,
      req.params.vehicleType as 'Car' | 'Bike',
      req.query as any,
    );

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const searchDealerProductsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Same as getDealerProducts with search query
    const dealerId = (req as any).dealerId;
    const result = await getDealerProducts(dealerId, req.query as any);

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};



