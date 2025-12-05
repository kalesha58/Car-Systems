import { Product, IProductDocument } from '../../models/Product';
import {
  IDealerProduct,
  ICreateDealerProductRequest,
  IUpdateDealerProductRequest,
  IUpdateProductStockRequest,
  IUpdateProductStatusRequest,
  IUpdateProductImagesRequest,
  IGetDealerProductsRequest,
} from '../../types/dealer/product';
import { NotFoundError, AppError, ForbiddenError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { IPaginationResponse } from '../../types/admin';

/**
 * Convert product document to dealer product interface
 */
const productToDealerProduct = (doc: IProductDocument): IDealerProduct => {
  return {
    id: (doc._id as any).toString(),
    dealerId: doc.userId, // Map userId to dealerId
    name: doc.name,
    brand: doc.brand,
    price: doc.price,
    originalPrice: doc.originalPrice,
    discountPercentage: doc.discountPercentage,
    stock: doc.stock,
    images: doc.images,
    description: doc.description,
    category: undefined, // Will be populated from categoryId if needed
    vehicleType: doc.vehicleType as 'Car' | 'Bike' | undefined,
    specifications: doc.specifications || {},
    tags: doc.tags || [],
    status: doc.status,
    createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
  };
};

/**
 * Get all products for a dealer
 */
export const getDealerProducts = async (
  dealerId: string,
  query: IGetDealerProductsRequest,
): Promise<{ products: IDealerProduct[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = { userId: dealerId }; // Use userId field to filter by dealer

    if (query.category) {
      // Note: This would need categoryId lookup if category is stored as name
      // For now, assuming categoryId is used
    }

    if (query.vehicleType) {
      filter.vehicleType = query.vehicleType;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
      if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { brand: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    return {
      products: products.map(productToDealerProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting dealer products:', error);
    throw error;
  }
};

/**
 * Get product by ID
 */
export const getDealerProductById = async (
  productId: string,
  dealerId: string,
): Promise<IDealerProduct> => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Verify dealer owns this product
    if (product.userId !== dealerId) {
      throw new ForbiddenError('Unauthorized to access this product');
    }

    return productToDealerProduct(product);
  } catch (error) {
    logger.error('Error getting dealer product by ID:', error);
    throw error;
  }
};

/**
 * Create product
 */
export const createDealerProduct = async (
  dealerId: string,
  data: ICreateDealerProductRequest,
): Promise<IDealerProduct> => {
  try {
    // Validate required fields
    if (!data.name?.trim()) {
      throw new AppError('Product name is required', 400);
    }

    if (!data.brand?.trim()) {
      throw new AppError('Brand is required', 400);
    }

    if (!data.price || data.price <= 0) {
      throw new AppError('Price must be greater than 0', 400);
    }

    // Validate and calculate discount fields
    let finalOriginalPrice = data.originalPrice;
    let finalDiscountPercentage = data.discountPercentage;

    if (data.discountPercentage !== undefined && data.discountPercentage > 0) {
      if (data.discountPercentage < 0 || data.discountPercentage > 100) {
        throw new AppError('Discount percentage must be between 0 and 100', 400);
      }
      finalDiscountPercentage = data.discountPercentage;
      
      // If originalPrice is not provided, calculate it from discount
      if (!data.originalPrice) {
        finalOriginalPrice = data.price / (1 - data.discountPercentage / 100);
      } else {
        // Validate that price matches discounted price
        const calculatedPrice = data.originalPrice * (1 - data.discountPercentage / 100);
        if (Math.abs(calculatedPrice - data.price) > 0.01) {
          throw new AppError('Price does not match the discount calculation', 400);
        }
        finalOriginalPrice = data.originalPrice;
      }
    } else if (data.originalPrice !== undefined && data.originalPrice > data.price) {
      // If only originalPrice is provided, calculate discount percentage
      finalOriginalPrice = data.originalPrice;
      finalDiscountPercentage = ((data.originalPrice - data.price) / data.originalPrice) * 100;
    }

    if (finalOriginalPrice !== undefined && finalOriginalPrice <= 0) {
      throw new AppError('Original price must be greater than 0', 400);
    }

    if (data.stock === undefined || data.stock < 0) {
      throw new AppError('Stock must be a non-negative number', 400);
    }

    if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
      throw new AppError('At least one image is required', 400);
    }

    // Note: categoryId is required in Product model, but we're using category name
    // This might need adjustment based on how categories are handled
    // For now, we'll use a default or require categoryId
    if (!data.category) {
      throw new AppError('Category is required', 400);
    }

    const product = new Product({
      name: data.name.trim(),
      brand: data.brand.trim(),
      categoryId: data.category, // Assuming category is categoryId
      price: data.price,
      originalPrice: finalOriginalPrice,
      discountPercentage: finalDiscountPercentage,
      stock: data.stock,
      status: data.stock > 0 ? 'active' : 'out_of_stock',
      images: data.images,
      description: data.description?.trim(),
      vehicleType: data.vehicleType,
      specifications: data.specifications || {},
      tags: data.tags || [],
      userId: dealerId, // Map dealerId to userId
    });

    await product.save();

    logger.info(`Product created for dealer: ${dealerId}`);

    return productToDealerProduct(product);
  } catch (error) {
    logger.error('Error creating dealer product:', error);
    throw error;
  }
};

/**
 * Update product
 */
export const updateDealerProduct = async (
  productId: string,
  dealerId: string,
  data: IUpdateDealerProductRequest,
): Promise<IDealerProduct> => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Verify dealer owns this product
    if (product.userId !== dealerId) {
      throw new ForbiddenError('Unauthorized to update this product');
    }

    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw new AppError('Product name cannot be empty', 400);
      }
      product.name = data.name.trim();
    }

    if (data.brand !== undefined) {
      if (!data.brand.trim()) {
        throw new AppError('Brand cannot be empty', 400);
      }
      product.brand = data.brand.trim();
    }

    if (data.price !== undefined) {
      if (data.price <= 0) {
        throw new AppError('Price must be greater than 0', 400);
      }
      product.price = data.price;
    }

    // Handle discount fields
    const currentPrice = data.price !== undefined ? data.price : product.price;
    
    if (data.discountPercentage !== undefined) {
      if (data.discountPercentage < 0 || data.discountPercentage > 100) {
        throw new AppError('Discount percentage must be between 0 and 100', 400);
      }
      
      // If discount is removed, clear originalPrice
      if (data.discountPercentage === 0 || data.discountPercentage === null) {
        product.originalPrice = undefined;
        product.discountPercentage = undefined;
      } else {
        product.discountPercentage = data.discountPercentage;
        
        // If originalPrice is not provided, calculate it from discount
        if (!data.originalPrice) {
          product.originalPrice = currentPrice / (1 - data.discountPercentage / 100);
        } else {
          // Validate that price matches discounted price
          if (data.originalPrice <= 0) {
            throw new AppError('Original price must be greater than 0', 400);
          }
          const calculatedPrice = data.originalPrice * (1 - data.discountPercentage / 100);
          if (Math.abs(calculatedPrice - currentPrice) > 0.01) {
            throw new AppError('Price does not match the discount calculation', 400);
          }
          product.originalPrice = data.originalPrice;
        }
      }
    } else if (data.originalPrice !== undefined) {
      if (data.originalPrice <= 0) {
        throw new AppError('Original price must be greater than 0', 400);
      }
      
      if (data.originalPrice > currentPrice) {
        // Calculate discount percentage from original price
        product.originalPrice = data.originalPrice;
        product.discountPercentage = ((data.originalPrice - currentPrice) / data.originalPrice) * 100;
      } else {
        // If originalPrice is less than or equal to price, clear discount
        product.originalPrice = undefined;
        product.discountPercentage = undefined;
      }
    }

    if (data.stock !== undefined) {
      if (data.stock < 0) {
        throw new AppError('Stock must be a non-negative number', 400);
      }
      product.stock = data.stock;
      // Update status based on stock
      if (data.stock === 0) {
        product.status = 'out_of_stock';
      } else if (product.status === 'out_of_stock') {
        product.status = 'active';
      }
    }

    if (data.images !== undefined) {
      if (!Array.isArray(data.images) || data.images.length === 0) {
        throw new AppError('At least one image is required', 400);
      }
      product.images = data.images;
    }

    if (data.description !== undefined) {
      product.description = data.description?.trim();
    }

    if (data.category !== undefined) {
      product.categoryId = data.category; // Assuming category is categoryId
    }

    if (data.vehicleType !== undefined) {
      product.vehicleType = data.vehicleType;
    }

    if (data.specifications !== undefined) {
      product.specifications = data.specifications;
    }

    if (data.tags !== undefined) {
      product.tags = data.tags;
    }

    if (data.status !== undefined) {
      product.status = data.status;
    }

    await product.save();

    logger.info(`Product updated: ${productId}`);

    return productToDealerProduct(product);
  } catch (error) {
    logger.error('Error updating dealer product:', error);
    throw error;
  }
};

/**
 * Update product stock
 */
export const updateProductStock = async (
  productId: string,
  dealerId: string,
  data: IUpdateProductStockRequest,
): Promise<IDealerProduct> => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Verify dealer owns this product
    if (product.userId !== dealerId) {
      throw new ForbiddenError('Unauthorized to update this product');
    }

    if (data.stock < 0) {
      throw new AppError('Stock must be a non-negative number', 400);
    }

    product.stock = data.stock;

    // Update status based on stock
    if (data.stock === 0) {
      product.status = 'out_of_stock';
    } else if (product.status === 'out_of_stock') {
      product.status = 'active';
    }

    await product.save();

    logger.info(`Product stock updated: ${productId} - ${data.stock}`);

    return productToDealerProduct(product);
  } catch (error) {
    logger.error('Error updating product stock:', error);
    throw error;
  }
};

/**
 * Update product status
 */
export const updateProductStatus = async (
  productId: string,
  dealerId: string,
  data: IUpdateProductStatusRequest,
): Promise<IDealerProduct> => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Verify dealer owns this product
    if (product.userId !== dealerId) {
      throw new ForbiddenError('Unauthorized to update this product');
    }

    product.status = data.status;

    await product.save();

    logger.info(`Product status updated: ${productId} - ${data.status}`);

    return productToDealerProduct(product);
  } catch (error) {
    logger.error('Error updating product status:', error);
    throw error;
  }
};

/**
 * Update product images
 */
export const updateProductImages = async (
  productId: string,
  dealerId: string,
  data: IUpdateProductImagesRequest,
): Promise<IDealerProduct> => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Verify dealer owns this product
    if (product.userId !== dealerId) {
      throw new ForbiddenError('Unauthorized to update this product');
    }

    if (!Array.isArray(data.images) || data.images.length === 0) {
      throw new AppError('At least one image is required', 400);
    }

    product.images = data.images;

    await product.save();

    logger.info(`Product images updated: ${productId}`);

    return productToDealerProduct(product);
  } catch (error) {
    logger.error('Error updating product images:', error);
    throw error;
  }
};

/**
 * Delete product
 */
export const deleteDealerProduct = async (productId: string, dealerId: string): Promise<void> => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Verify dealer owns this product
    if (product.userId !== dealerId) {
      throw new ForbiddenError('Unauthorized to delete this product');
    }

    await Product.findByIdAndDelete(productId);

    logger.info(`Product deleted: ${productId}`);
  } catch (error) {
    logger.error('Error deleting dealer product:', error);
    throw error;
  }
};

/**
 * Get products by category
 */
export const getProductsByCategory = async (
  dealerId: string,
  category: string,
  query: IGetDealerProductsRequest,
): Promise<{ products: IDealerProduct[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = { userId: dealerId, categoryId: category };

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    return {
      products: products.map(productToDealerProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting products by category:', error);
    throw error;
  }
};

/**
 * Get products by vehicle type
 */
export const getProductsByVehicleType = async (
  dealerId: string,
  vehicleType: 'Car' | 'Bike',
  query: IGetDealerProductsRequest,
): Promise<{ products: IDealerProduct[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = { userId: dealerId, vehicleType };

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    return {
      products: products.map(productToDealerProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting products by vehicle type:', error);
    throw error;
  }
};



