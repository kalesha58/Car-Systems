import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import {
  getAdminPosts,
  getAdminPostStats,
  getAdminPostById,
  deleteAdminPost,
  bulkDeleteAdminPosts,
} from '../../services/admin/postService';

export const getAdminPostsController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const search = req.query.search as string | undefined;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    const result = await getAdminPosts({ page, limit, search, sortBy, sortOrder });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getAdminPostStatsController = async (
  _req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const stats = await getAdminPostStats();
    res.status(200).json({ success: true, stats });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getAdminPostByIdController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const post = await getAdminPostById(req.params.id);
    res.status(200).json({ success: true, post });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const deleteAdminPostController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    await deleteAdminPost(req.params.id);
    res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const bulkDeleteAdminPostsController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    const result = await bulkDeleteAdminPosts(ids);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
