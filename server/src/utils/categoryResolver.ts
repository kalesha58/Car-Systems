import mongoose from 'mongoose';
import { Category } from '../models/Category';
import { AppError } from './errorHandler';

/**
 * Resolve a category MongoDB id from either an ObjectId string or a category name.
 */
export const resolveCategoryId = async (categoryIdOrName: string): Promise<string> => {
  if (!categoryIdOrName?.trim()) {
    throw new AppError('Category is required', 400);
  }

  const value = categoryIdOrName.trim();

  if (mongoose.Types.ObjectId.isValid(value)) {
    const byId = await Category.findById(value).select('_id').lean();
    if (byId) {
      return byId._id.toString();
    }
  }

  const byName = await Category.findOne({ name: value }).select('_id').lean();
  if (byName) {
    return byName._id.toString();
  }

  throw new AppError('Category not found', 400);
};
