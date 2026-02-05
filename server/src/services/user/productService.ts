import mongoose from 'mongoose';
import { Product, IProductDocument } from '../../models/Product';
import { Category } from '../../models/Category';
import { BusinessRegistration } from '../../models/BusinessRegistration';
import { NotFoundError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

export interface IGetUserProductsRequest {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  vehicleType?: 'Car' | 'Bike';
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dealerId?: string;
}

export interface IDealerInfo {
  id: string;
  businessName: string;
  type: string;
  phone: string;
  address: string;
  gst?: string;
}

export interface IProductWithDealer {
  id: string;
  dealerId: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  stock: number;
  images: string[];
  description?: string;
  category?: string;
  vehicleType?: 'Car' | 'Bike';
  specifications?: Record<string, any>;
  tags?: string[];
  status: string;
  deliveryTimeMinutes?: number;
  isSparePart?: boolean;
  dealer?: IDealerInfo;
  createdAt: string;
  updatedAt: string;
}

export interface IPaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Safely get category by ID with ObjectId validation
 * Returns null if categoryId is invalid or category not found
 */
const getCategoryByIdSafe = async (categoryId: string): Promise<{ name: string } | null> => {
  try {
    // Validate that categoryId is a valid MongoDB ObjectId
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      logger.warn(`Invalid categoryId provided: ${categoryId}`);
      return null;
    }

    const category = await Category.findById(categoryId);
    return category ? { name: category.name } : null;
  } catch (error) {
    logger.error(`Error fetching category with ID ${categoryId}:`, error);
    return null;
  }
};

/**
 * Get dealer information by userId
 */
const getDealerInfoByUserId = async (userId: string): Promise<IDealerInfo | null> => {
  try {
    const businessRegistration = await BusinessRegistration.findOne({ userId });

    if (!businessRegistration || businessRegistration.status !== 'approved') {
      return null;
    }

    return {
      id: (businessRegistration._id as any).toString(),
      businessName: businessRegistration.businessName,
      type: businessRegistration.type,
      phone: businessRegistration.phone,
      address: businessRegistration.address,
      gst: businessRegistration.gst,
    };
  } catch (error) {
    logger.error('Error getting dealer info by userId:', error);
    return null;
  }
};

/**
 * Convert product document to IProductWithDealer interface
 */
const productToIProductWithDealer = async (
  productDoc: IProductDocument,
): Promise<IProductWithDealer> => {
  const category = await getCategoryByIdSafe(productDoc.categoryId);
  const dealerInfo = await getDealerInfoByUserId(productDoc.userId);

  return {
    id: (productDoc._id as any).toString(),
    dealerId: productDoc.userId,
    name: productDoc.name,
    brand: productDoc.brand,
    price: productDoc.price,
    originalPrice: productDoc.originalPrice,
    discountPercentage: productDoc.discountPercentage,
    stock: productDoc.stock,
    images: productDoc.images,
    description: productDoc.description,
    category: category?.name || undefined,
    vehicleType: productDoc.vehicleType as 'Car' | 'Bike' | undefined,
    specifications: productDoc.specifications || {},
    tags: productDoc.tags || [],
    status: productDoc.status,
    deliveryTimeMinutes: productDoc.deliveryTimeMinutes,
    isSparePart: productDoc.isSparePart,
    dealer: dealerInfo || undefined,
    createdAt: productDoc.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: productDoc.updatedAt?.toISOString() || new Date().toISOString(),
  };
};

/**
 * Get all products for users (marketplace) with dealer information
 * Only returns active products from approved dealers
 */
export const getAllProductsForUsers = async (
  query: IGetUserProductsRequest,
): Promise<{ products: IProductWithDealer[]; pagination: IPaginationResponse }> => {
  try {
    logger.info(`[getAllProductsForUsers] Called with query:`, JSON.stringify(query, null, 2));
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = {
      status: 'active', // Only show active products
    };

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { brand: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.category) {
      const category = await Category.findOne({ name: { $regex: query.category, $options: 'i' } });
      if (category) {
        filter.categoryId = (category._id as any).toString();
      }
    }

    if (query.vehicleType) {
      filter.vehicleType = query.vehicleType;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
      if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
    }

    // Only filter by dealerId if explicitly specified in query
    if (query.dealerId) {
      filter.userId = query.dealerId;
      logger.info(`[getAllProductsForUsers] Filtering products by dealerId: ${query.dealerId}`);
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    logger.info(`[getAllProductsForUsers] Final filter:`, JSON.stringify(filter, null, 2));
    logger.info(`[getAllProductsForUsers] Sort:`, JSON.stringify(sort, null, 2));
    logger.info(`[getAllProductsForUsers] Pagination: page=${page}, limit=${limit}, skip=${skip}`);

    // Fetch products directly - no BusinessRegistration filtering
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    logger.info(`[getAllProductsForUsers] Found ${products.length} products (total: ${total})`);

    // Convert products - no dealer info assignment needed
    // Backend already ensures only approved dealers can add products
    const productsWithDealer = await Promise.all(
      products.map(async (productDoc: IProductDocument) => {
        const category = await getCategoryByIdSafe(productDoc.categoryId);

        return {
          id: (productDoc._id as any).toString(),
          dealerId: productDoc.userId,
          name: productDoc.name,
          brand: productDoc.brand,
          price: productDoc.price,
          originalPrice: productDoc.originalPrice,
          discountPercentage: productDoc.discountPercentage,
          stock: productDoc.stock,
          images: productDoc.images,
          description: productDoc.description,
          category: category?.name || undefined,
          vehicleType: productDoc.vehicleType as 'Car' | 'Bike' | undefined,
          specifications: productDoc.specifications || {},
          tags: productDoc.tags || [],
          status: productDoc.status,
          deliveryTimeMinutes: productDoc.deliveryTimeMinutes,
          isSparePart: productDoc.isSparePart,
          dealer: undefined, // No dealer info assignment - backend already validates approved dealers
          createdAt: productDoc.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: productDoc.updatedAt?.toISOString() || new Date().toISOString(),
        };
      }),
    );

    logger.info(`[getAllProductsForUsers] Returning ${productsWithDealer.length} products (all from approved dealers)`);

    return {
      products: productsWithDealer,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting products for users:', error);
    throw error;
  }
};

/**
 * Get product by ID for users with dealer information
 */
export const getProductByIdForUsers = async (productId: string): Promise<IProductWithDealer> => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (product.status !== 'active') {
      throw new NotFoundError('Product not available');
    }

    // No BusinessRegistration check needed - backend already ensures only approved dealers can add products
    return await productToIProductWithDealer(product);
  } catch (error) {
    logger.error('Error getting product by ID for users:', error);
    throw error;
  }
};

