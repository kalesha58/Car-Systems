import mongoose from 'mongoose';
import { Product, IProductDocument } from '../../models/Product';
import { Category } from '../../models/Category';
import {
  IGetProductsRequest,
  ICreateProductRequest,
  IUpdateProductRequest,
  IUpdateProductStockRequest,
  IProduct,
  IPaginationResponse,
} from '../../types/admin';
import { NotFoundError, ConflictError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

/**
 * Convert product document to IProduct interface
 */
const productToIProduct = async (productDoc: IProductDocument): Promise<IProduct> => {
  let category = null;
  
  // Check if categoryId is a valid MongoDB ObjectId
  const isValidObjectId = mongoose.Types.ObjectId.isValid(productDoc.categoryId);
  
  if (isValidObjectId) {
    // Try to find category by ID
    try {
      category = await Category.findById(productDoc.categoryId);
    } catch (error) {
      // If findById fails, try finding by name as fallback
      logger.warn(`Category lookup by ID failed for: ${productDoc.categoryId}, trying by name`);
      category = await Category.findOne({ name: productDoc.categoryId });
    }
  } else {
    // If not a valid ObjectId, try to find by name (for backward compatibility)
    category = await Category.findOne({ name: productDoc.categoryId });
  }
  
  return {
    id: (productDoc._id as any).toString(),
    name: productDoc.name,
    brand: productDoc.brand,
    category: category?.name || productDoc.categoryId || 'Unknown',
    price: productDoc.price,
    stock: productDoc.stock,
    status: productDoc.status,
    images: productDoc.images,
    description: productDoc.description,
    vehicleType: productDoc.vehicleType,
    tags: productDoc.tags,
    specifications: productDoc.specifications,
    userId: productDoc.userId,
    createdAt: productDoc.createdAt?.toISOString() || new Date().toISOString(),
  };
};

/**
 * Get all products with pagination and filters
 */
export const getProducts = async (
  query: IGetProductsRequest,
): Promise<{ products: IProduct[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.category) {
      const category = await Category.findOne({ name: { $regex: query.category, $options: 'i' } });
      if (category) {
        filter.categoryId = (category._id as any).toString();
      }
    }

    if (query.status) {
      filter.status = query.status;
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

    const productsWithCategory = await Promise.all(products.map(productToIProduct));

    return {
      products: productsWithCategory,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting products:', error);
    throw error;
  }
};

/**
 * Get product by ID
 */
export const getProductById = async (productId: string): Promise<IProduct> => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return await productToIProduct(product);
  } catch (error) {
    logger.error('Error getting product by ID:', error);
    throw error;
  }
};

/**
 * Create product
 */
export const createProduct = async (data: ICreateProductRequest, userId: string): Promise<IProduct> => {
  try {
    // const category = await Category.findById(data.categoryId);

    // if (!category) {
    //   throw new NotFoundError('Category not found');
    // }

    const product = new Product({
      name: data.name,
      brand: data.brand,
      categoryId: data.categoryId,
      price: data.price,
      stock: data.stock,
      description: data.description,
      vehicleType: data.vehicleType,
      tags: data.tags || [],
      specifications: data.specifications || {},
      status: data.stock > 0 ? 'active' : 'out_of_stock',
      userId: userId,
    });

    await product.save();

    logger.info(`New product created: ${product.name} by user: ${userId}`);

    return await productToIProduct(product);
  } catch (error) {
    logger.error('Error creating product:', error);
    throw error;
  }
};

/**
 * Update product
 */
export const updateProduct = async (productId: string, data: IUpdateProductRequest): Promise<IProduct> => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (data.name !== undefined) product.name = data.name;
    if (data.brand !== undefined) product.brand = data.brand;
    if (data.price !== undefined) product.price = data.price;
    if (data.stock !== undefined) {
      product.stock = data.stock;
      if (product.stock === 0) {
        product.status = 'out_of_stock';
      } else if (product.status === 'out_of_stock') {
        product.status = 'active';
      }
    }
    if (data.status !== undefined) product.status = data.status as any;
    if (data.description !== undefined) product.description = data.description;
    if (data.vehicleType !== undefined) product.vehicleType = data.vehicleType;

    await product.save();

    logger.info(`Product updated: ${product.name}`);

    return await productToIProduct(product);
  } catch (error) {
    logger.error('Error updating product:', error);
    throw error;
  }
};

/**
 * Delete product
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    await Product.findByIdAndDelete(productId);

    logger.info(`Product deleted: ${product.name}`);
  } catch (error) {
    logger.error('Error deleting product:', error);
    throw error;
  }
};

/**
 * Update product stock
 */
export const updateProductStock = async (
  productId: string,
  data: IUpdateProductStockRequest,
): Promise<IProduct> => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (data.operation === 'set') {
      product.stock = data.stock;
    } else if (data.operation === 'add') {
      product.stock += data.stock;
    } else if (data.operation === 'subtract') {
      product.stock = Math.max(0, product.stock - data.stock);
    }

    if (product.stock === 0) {
      product.status = 'out_of_stock';
    } else if (product.status === 'out_of_stock') {
      product.status = 'active';
    }

    await product.save();

    logger.info(`Product stock updated: ${product.name} - ${product.stock}`);

    return await productToIProduct(product);
  } catch (error) {
    logger.error('Error updating product stock:', error);
    throw error;
  }
};

