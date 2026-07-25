import mongoose from 'mongoose';
import { Review, IReviewDocument } from '../../models/Review';
import { Product } from '../../models/Product';
import { Order } from '../../models/Order';
import { SignUp } from '../../models/SignUp';
import { ForbiddenError, NotFoundError, ValidationError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

export interface IReviewResponse {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userImage?: string;
  rating: number;
  comment?: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IReviewSummary {
  averageRating: number;
  reviewCount: number;
  /** Count of reviews per star value, keyed '1'..'5'. */
  distribution: Record<string, number>;
}

export interface IPaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IGetReviewsRequest {
  page?: number;
  limit?: number;
}

const reviewToResponse = (doc: IReviewDocument): IReviewResponse => ({
  id: (doc._id as any).toString(),
  productId: doc.productId,
  userId: doc.userId,
  userName: doc.userName,
  userImage: doc.userImage,
  rating: doc.rating,
  comment: doc.comment,
  isVerifiedPurchase: doc.isVerifiedPurchase,
  createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
  updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
});

const assertValidProductId = (productId: string): void => {
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    throw new ValidationError('Invalid product ID');
  }
};

const ensureProductExists = async (productId: string): Promise<void> => {
  assertValidProductId(productId);
  const product = await Product.findById(productId).select('_id');
  if (!product) {
    throw new NotFoundError('Product not found');
  }
};

/**
 * Loads the product for a write and blocks the owning dealer from reviewing it,
 * so ratings cannot be self-inflated.
 */
const ensureReviewable = async (productId: string, userId: string): Promise<void> => {
  assertValidProductId(productId);
  const product = await Product.findById(productId).select('userId');

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  if (product.userId === userId) {
    throw new ForbiddenError('You cannot review your own product');
  }
};

/**
 * Recalculate a product's averageRating/reviewCount from its reviews and
 * persist them so product list/detail responses stay consistent.
 */
export const recalculateProductRating = async (productId: string): Promise<IReviewSummary> => {
  const [aggregate] = await Review.aggregate<{
    averageRating: number;
    reviewCount: number;
  }>([
    { $match: { productId } },
    {
      $group: {
        _id: '$productId',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const reviewCount = aggregate?.reviewCount ?? 0;
  // Keep one decimal place so clients can render "4.1" without further rounding.
  const averageRating = aggregate ? Math.round(aggregate.averageRating * 10) / 10 : 0;

  await Product.findByIdAndUpdate(productId, { averageRating, reviewCount });

  const distributionRows = await Review.aggregate<{ _id: number; count: number }>([
    { $match: { productId } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);

  const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  distributionRows.forEach((row) => {
    distribution[String(row._id)] = row.count;
  });

  return { averageRating, reviewCount, distribution };
};

/**
 * True when the user has an order containing this product that reached delivery.
 */
const hasPurchasedProduct = async (userId: string, productId: string): Promise<boolean> => {
  try {
    const order = await Order.findOne({
      userId,
      'items.productId': productId,
      status: { $in: ['DELIVERED', 'PAYMENT_CONFIRMED', 'ORDER_CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY'] },
    }).select('_id');
    return Boolean(order);
  } catch (error) {
    logger.warn('Unable to verify purchase for review:', error);
    return false;
  }
};

export const getProductReviews = async (
  productId: string,
  query: IGetReviewsRequest,
): Promise<{ reviews: IReviewResponse[]; summary: IReviewSummary; pagination: IPaginationResponse }> => {
  assertValidProductId(productId);

  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 10;
  const skip = (page - 1) * limit;

  const [reviews, total, summary] = await Promise.all([
    Review.find({ productId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Review.countDocuments({ productId }),
    getProductReviewSummary(productId),
  ]);

  return {
    reviews: reviews.map(reviewToResponse),
    summary,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
};

export const getProductReviewSummary = async (productId: string): Promise<IReviewSummary> => {
  assertValidProductId(productId);

  const rows = await Review.aggregate<{ _id: number; count: number }>([
    { $match: { productId } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);

  const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  let total = 0;
  let weighted = 0;

  rows.forEach((row) => {
    distribution[String(row._id)] = row.count;
    total += row.count;
    weighted += row._id * row.count;
  });

  return {
    averageRating: total > 0 ? Math.round((weighted / total) * 10) / 10 : 0,
    reviewCount: total,
    distribution,
  };
};

export const getMyProductReview = async (
  productId: string,
  userId: string,
): Promise<IReviewResponse | null> => {
  assertValidProductId(productId);
  const review = await Review.findOne({ productId, userId });
  return review ? reviewToResponse(review) : null;
};

export interface IUpsertReviewRequest {
  rating: number;
  comment?: string;
}

/**
 * Create or replace the caller's review for a product, then refresh the
 * product's denormalized rating fields.
 */
export const upsertProductReview = async (
  productId: string,
  userId: string,
  payload: IUpsertReviewRequest,
): Promise<{ review: IReviewResponse; summary: IReviewSummary }> => {
  await ensureReviewable(productId, userId);

  const rating = Number(payload.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new ValidationError('Rating must be a number between 1 and 5');
  }

  const user = await SignUp.findById(userId).select('name profileImage');
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const comment = typeof payload.comment === 'string' ? payload.comment.trim() : undefined;
  const isVerifiedPurchase = await hasPurchasedProduct(userId, productId);

  const review = await Review.findOneAndUpdate(
    { productId, userId },
    {
      productId,
      userId,
      userName: user.name,
      userImage: user.profileImage,
      rating: Math.round(rating),
      comment: comment || undefined,
      isVerifiedPurchase,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const summary = await recalculateProductRating(productId);

  logger.info(`Review saved for product ${productId} by user ${userId}`);

  return { review: reviewToResponse(review as IReviewDocument), summary };
};

export const deleteProductReview = async (
  productId: string,
  userId: string,
): Promise<IReviewSummary> => {
  assertValidProductId(productId);

  const deleted = await Review.findOneAndDelete({ productId, userId });
  if (!deleted) {
    throw new NotFoundError('Review not found');
  }

  return recalculateProductRating(productId);
};
