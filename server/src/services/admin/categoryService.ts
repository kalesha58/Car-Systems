import { Category, ICategoryDocument } from '../../models/Category';
import { Product } from '../../models/Product';
import { IGetCategoriesRequest, ICreateCategoryRequest, IUpdateCategoryRequest, ICategory } from '../../types/admin';
import { NotFoundError, ConflictError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

/**
 * Convert category document to ICategory interface
 */
const categoryToICategory = async (categoryDoc: ICategoryDocument): Promise<ICategory> => {
  const productCount = await Product.countDocuments({ categoryId: (categoryDoc._id as any).toString() });
  return {
    id: (categoryDoc._id as any).toString(),
    name: categoryDoc.name,
    description: categoryDoc.description,
    status: categoryDoc.status,
    products: productCount,
    createdAt: categoryDoc.createdAt?.toISOString() || new Date().toISOString(),
  };
};

/**
 * Get all categories
 */
export const getCategories = async (query: IGetCategoriesRequest): Promise<ICategory[]> => {
  try {
    const filter: any = {};

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.status) {
      filter.status = query.status;
    }

    const categories = await Category.find(filter).sort({ name: 1 });

    return await Promise.all(categories.map(categoryToICategory));
  } catch (error) {
    logger.error('Error getting categories:', error);
    throw error;
  }
};

/**
 * Get category by ID
 */
export const getCategoryById = async (categoryId: string): Promise<ICategory> => {
  try {
    const category = await Category.findById(categoryId);

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return await categoryToICategory(category);
  } catch (error) {
    logger.error('Error getting category by ID:', error);
    throw error;
  }
};

/**
 * Create category
 */
export const createCategory = async (data: ICreateCategoryRequest): Promise<ICategory> => {
  try {
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${data.name}$`, 'i') } });

    if (existingCategory) {
      throw new ConflictError('Category with this name already exists');
    }

    const category = new Category({
      name: data.name,
      description: data.description,  
      status: data.status || 'active',
    });

    await category.save();

    logger.info(`New category created: ${category.name}`);

    return await categoryToICategory(category);
  } catch (error) {
    logger.error('Error creating category:', error);
    throw error;
  }
};

/**
 * Update category
 */
export const updateCategory = async (categoryId: string, data: IUpdateCategoryRequest): Promise<ICategory> => {
  try {
    const category = await Category.findById(categoryId);

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (data.name !== undefined) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${data.name}$`, 'i') },
        _id: { $ne: categoryId },
      });

      if (existingCategory) {
        throw new ConflictError('Category with this name already exists');
      }

      category.name = data.name;
    }
    if (data.description !== undefined) category.description = data.description;
    if (data.status !== undefined) category.status = data.status as any;

    await category.save();

    logger.info(`Category updated: ${category.name}`);

    return await categoryToICategory(category);
  } catch (error) {
    logger.error('Error updating category:', error);
    throw error;
  }
};

/**
 * Delete category
 */
export const deleteCategory = async (categoryId: string): Promise<void> => {
  try {
    const category = await Category.findById(categoryId);

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ categoryId: categoryId });
    if (productCount > 0) {
      throw new ConflictError('Cannot delete category with existing products');
    }

    await Category.findByIdAndDelete(categoryId);

    logger.info(`Category deleted: ${category.name}`);
  } catch (error) {
    logger.error('Error deleting category:', error);
    throw error;
  }
};

