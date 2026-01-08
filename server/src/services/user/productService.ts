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

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    // Get all unique userIds from products
    const userIds = [...new Set(products.map((p) => p.userId))];

    // Fetch all business registrations for these users in one query
    // Filter to only include approved registrations with open stores
    const businessRegistrations = await BusinessRegistration.find({
      userId: { $in: userIds },
      status: 'approved',
      storeOpen: { $ne: false }, // Include true or undefined (defaults to true)
    });

    // Create a set of userIds with open stores for quick lookup
    const openStoreUserIds = new Set<string>();
    // Create a map of userId to dealer info for quick lookup
    const dealerInfoMap = new Map<string, IDealerInfo>();
    businessRegistrations.forEach((reg) => {
      // Only include if storeOpen is true (or undefined which defaults to true)
      if (reg.storeOpen !== false) {
        openStoreUserIds.add(reg.userId);
        dealerInfoMap.set(reg.userId, {
          id: (reg._id as any).toString(),
          businessName: reg.businessName,
          type: reg.type,
          phone: reg.phone,
          address: reg.address,
          gst: reg.gst,
        });
      }
    });

    // Filter products to only include those from dealers with open stores
    const productsFromOpenStores = products.filter((productDoc) => 
      openStoreUserIds.has(productDoc.userId)
    );

    // Convert products and attach dealer info
    const productsWithDealer = await Promise.all(
      productsFromOpenStores.map(async (productDoc) => {
        const category = await getCategoryByIdSafe(productDoc.categoryId);
        const dealerInfo = dealerInfoMap.get(productDoc.userId) || null;

        return {
          id: (productDoc._id as any).toString(),
          dealerId: productDoc.userId,
          name: productDoc.name,
          brand: productDoc.brand,
          price: productDoc.price,
          stock: productDoc.stock,
          images: productDoc.images,
          description: productDoc.description,
          category: category?.name || undefined,
          vehicleType: productDoc.vehicleType as 'Car' | 'Bike' | undefined,
          specifications: productDoc.specifications || {},
          tags: productDoc.tags || [],
          status: productDoc.status,
          dealer: dealerInfo || undefined,
          createdAt: productDoc.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: productDoc.updatedAt?.toISOString() || new Date().toISOString(),
        };
      }),
    );

    // Recalculate total for pagination (products from open stores only)
    const totalFromOpenStores = await Product.countDocuments({
      ...filter,
      userId: { $in: Array.from(openStoreUserIds) },
    });

    return {
      products: productsWithDealer,
      pagination: {
        page,
        limit,
        total: totalFromOpenStores,
        totalPages: Math.ceil(totalFromOpenStores / limit),
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

    // Check if dealer's store is open
    const businessRegistration = await BusinessRegistration.findOne({
      userId: product.userId,
      status: 'approved',
    });

    if (!businessRegistration || businessRegistration.storeOpen === false) {
      throw new NotFoundError('Product not available - store is closed');
    }

    return await productToIProductWithDealer(product);
  } catch (error) {
    logger.error('Error getting product by ID for users:', error);
    throw error;
  }
};

