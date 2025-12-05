import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from '../../services/admin/categoryService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const getCategoriesController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await getCategories(req.query as any);
    res.status(200).json({ categories });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getCategoryByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const category = await getCategoryById(req.params.id);
    res.status(200).json(category);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const createCategoryController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const category = await createCategory(req.body);
    res.status(201).json(category);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateCategoryController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const category = await updateCategory(req.params.id, req.body);
    res.status(200).json(category);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const deleteCategoryController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await deleteCategory(req.params.id);
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

