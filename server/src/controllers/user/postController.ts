import { Response, NextFunction } from 'express';
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  likeComment,
  unlikeComment,
} from '../../services/user/postService';
import { ICreatePostRequest, IUpdatePostRequest } from '../../types/post';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { logger } from '../../utils/logger';

/**
 * Create post controller
 */
export const createPostController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const postData: ICreatePostRequest = req.body;
    const result = await createPost(userId, postData);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get all posts controller
 */
export const getPostsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.query.userId as string | undefined;
    const currentUserId = req.user?.userId;
    const result = await getPosts(userId, currentUserId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get post by ID controller
 */
export const getPostByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const postId = req.params.id;
    const currentUserId = req.user?.userId;
    const result = await getPostById(postId, currentUserId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Update post controller
 */
export const updatePostController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const postId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const postData: IUpdatePostRequest = req.body;
    const result = await updatePost(postId, userId, postData);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Delete post controller
 */
export const deletePostController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const postId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    await deletePost(postId, userId);

    res.status(200).json({
      success: true,
      Response: {
        ReturnMessage: 'Post deleted successfully',
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Like post controller
 */
export const likePostController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const postId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const result = await likePost(postId, userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Unlike post controller
 */
export const unlikePostController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const postId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const result = await unlikePost(postId, userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Add comment controller
 */
export const addCommentController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const postId = req.params.id;
    const { text, parentCommentId } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    if (!text || !text.trim()) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Comment text is required',
        },
      });
      return;
    }

    const result = await addComment(postId, userId, text, parentCommentId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Like comment controller
 */
export const likeCommentController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const postId = req.params.postId;
    const commentId = req.params.commentId;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const result = await likeComment(postId, commentId, userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Unlike comment controller
 */
export const unlikeCommentController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const postId = req.params.postId;
    const commentId = req.params.commentId;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const result = await unlikeComment(postId, commentId, userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

