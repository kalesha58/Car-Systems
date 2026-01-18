import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { getAllProductsForUsers, getProductByIdForUsers, IGetUserProductsRequest } from '../../services/user/productService';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { BusinessRegistration } from '../../models/BusinessRegistration';
import { Product } from '../../models/Product';

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
    logger.info(`[getAllProductsController] Query params:`, JSON.stringify(req.query, null, 2));
    
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
      dealerId: req.query.dealerId as string | undefined,
    };

    logger.info(`[getAllProductsController] Parsed query:`, JSON.stringify(query, null, 2));
    logger.info(`[getAllProductsController] Calling getAllProductsForUsers service...`);

    const result = await getAllProductsForUsers(query);

    logger.info(`[getAllProductsController] Service returned result:`, {
      productsCount: result.products.length,
      pagination: result.pagination,
      firstProduct: result.products[0] ? {
        id: result.products[0].id,
        name: result.products[0].name,
        dealerId: result.products[0].dealerId,
        hasDealer: !!result.products[0].dealer,
        dealerName: result.products[0].dealer?.businessName,
      } : null,
    });
    
    if (result.products.length === 0) {
      logger.warn(`[getAllProductsController] ⚠️  Returning empty products array to client`);
    } else {
      logger.info(`[getAllProductsController] ✅ Successfully returning ${result.products.length} products to client`);
    }

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

/**
 * Diagnostic endpoint to check products and dealers
 * This helps debug why products aren't showing
 */
export const getProductsDiagnosticController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    logger.info(`[getProductsDiagnosticController] Diagnostic check requested`);
    
    // Check approved dealers
    const approvedDealers = await BusinessRegistration.find({ status: 'approved' });
    const openStoreDealers = await BusinessRegistration.find({
      status: 'approved',
      storeOpen: { $ne: false },
    });
    
    // Get dealer userIds
    const openStoreUserIds = openStoreDealers.map(d => d.userId);
    
    // Check products
    const totalProducts = await Product.countDocuments({});
    const activeProducts = await Product.countDocuments({ status: 'active' });
    const productsForOpenStores = await Product.countDocuments({
      status: 'active',
      userId: { $in: openStoreUserIds },
    });
    
    // Get sample products
    const sampleProducts = await Product.find({ status: 'active' }).limit(5);
    const sampleProductsWithDealer = sampleProducts.map(p => ({
      id: (p._id as any).toString(),
      name: p.name,
      userId: p.userId,
      status: p.status,
      hasMatchingDealer: openStoreUserIds.includes(p.userId),
    }));
    
    // Get dealer details
    const dealerDetails = openStoreDealers.map(d => ({
      userId: d.userId,
      businessName: d.businessName,
      status: d.status,
      storeOpen: d.storeOpen,
      productCount: 0, // Will be calculated below
    }));
    
    // Count products per dealer
    for (const dealer of dealerDetails) {
      dealer.productCount = await Product.countDocuments({
        userId: dealer.userId,
        status: 'active',
      });
    }
    
    const diagnostic = {
      dealers: {
        totalApproved: approvedDealers.length,
        withOpenStores: openStoreDealers.length,
        details: dealerDetails,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        activeFromOpenStores: productsForOpenStores,
        sample: sampleProductsWithDealer,
      },
      summary: {
        issue: productsForOpenStores === 0 ? 'No products found for approved dealers with open stores' : 'Products available',
        possibleCauses: productsForOpenStores === 0 ? [
          openStoreDealers.length === 0 ? 'No approved dealers with open stores' : null,
          activeProducts === 0 ? 'No active products in database' : null,
          activeProducts > 0 && openStoreUserIds.length > 0 ? 'Product userId does not match dealer userId' : null,
        ].filter(Boolean) : [],
      },
    };
    
    logger.info(`[getProductsDiagnosticController] Diagnostic result:`, JSON.stringify(diagnostic, null, 2));
    
    res.status(200).json({
      success: true,
      Response: diagnostic,
    });
  } catch (error) {
    logger.error('[getProductsDiagnosticController] Error:', error);
    errorHandler(error as IAppError, res);
  }
};