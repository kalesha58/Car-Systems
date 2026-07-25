import { Response } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import {
  deleteProductReview,
  getMyProductReview,
  getProductReviewSummary,
  getProductReviews,
  upsertProductReview,
} from '../../services/user/reviewService';

export const getProductReviewsController = async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const productId = req.params.id;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    const result = await getProductReviews(productId, { page, limit });

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getProductReviewSummaryController = async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const summary = await getProductReviewSummary(req.params.id);

    res.status(200).json({
      success: true,
      Response: summary,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getMyProductReviewController = async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const review = await getMyProductReview(req.params.id, req.user.userId);

    res.status(200).json({
      success: true,
      Response: review,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const upsertProductReviewController = async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { rating, comment } = req.body as { rating?: number; comment?: string };

    if (rating === undefined || rating === null) {
      res.status(400).json({
        success: false,
        message: 'Rating is required',
        Response: { ReturnMessage: 'Rating is required' },
      });
      return;
    }

    const result = await upsertProductReview(req.params.id, req.user.userId, {
      rating: Number(rating),
      comment,
    });

    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const deleteProductReviewController = async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const summary = await deleteProductReview(req.params.id, req.user.userId);

    res.status(200).json({
      success: true,
      Response: summary,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
