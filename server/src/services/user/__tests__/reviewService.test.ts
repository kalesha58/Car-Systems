jest.mock('../../../models/Review', () => ({
  Review: {
    aggregate: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
}));

jest.mock('../../../models/Product', () => ({
  Product: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock('../../../models/Order', () => ({
  Order: {
    findOne: jest.fn(),
  },
}));

jest.mock('../../../models/SignUp', () => ({
  SignUp: {
    findById: jest.fn(),
  },
}));

import { Review } from '../../../models/Review';
import { Product } from '../../../models/Product';
import { Order } from '../../../models/Order';
import { SignUp } from '../../../models/SignUp';
import {
  deleteProductReview,
  getProductReviewSummary,
  recalculateProductRating,
  upsertProductReview,
} from '../reviewService';

const PRODUCT_ID = '507f1f77bcf86cd799439011';
const USER_ID = '507f1f77bcf86cd799439022';
const DEALER_ID = '507f1f77bcf86cd799439033';

/** Mongoose query builders are chainable, so stub `select` fluently. */
const selectResolving = (value: unknown) => ({
  select: jest.fn().mockResolvedValue(value),
});

describe('reviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recalculateProductRating', () => {
    it('averages ratings to one decimal place and persists them on the product', async () => {
      (Review.aggregate as jest.Mock)
        .mockResolvedValueOnce([{ averageRating: 4.125, reviewCount: 8 }])
        .mockResolvedValueOnce([
          { _id: 5, count: 4 },
          { _id: 4, count: 3 },
          { _id: 1, count: 1 },
        ]);
      (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const summary = await recalculateProductRating(PRODUCT_ID);

      expect(summary.averageRating).toBe(4.1);
      expect(summary.reviewCount).toBe(8);
      expect(summary.distribution).toEqual({ '1': 1, '2': 0, '3': 0, '4': 3, '5': 4 });
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(PRODUCT_ID, {
        averageRating: 4.1,
        reviewCount: 8,
      });
    });

    it('resets the product to zero when the last review is removed', async () => {
      (Review.aggregate as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const summary = await recalculateProductRating(PRODUCT_ID);

      expect(summary).toEqual({
        averageRating: 0,
        reviewCount: 0,
        distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
      });
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(PRODUCT_ID, {
        averageRating: 0,
        reviewCount: 0,
      });
    });
  });

  describe('getProductReviewSummary', () => {
    it('derives the average from the star distribution', async () => {
      (Review.aggregate as jest.Mock).mockResolvedValue([
        { _id: 5, count: 2 },
        { _id: 3, count: 1 },
      ]);

      const summary = await getProductReviewSummary(PRODUCT_ID);

      // (5 + 5 + 3) / 3 = 4.333... -> 4.3
      expect(summary.averageRating).toBe(4.3);
      expect(summary.reviewCount).toBe(3);
    });

    it('rejects an id that is not a valid ObjectId', async () => {
      await expect(getProductReviewSummary('not-an-id')).rejects.toThrow('Invalid product ID');
    });
  });

  describe('upsertProductReview', () => {
    beforeEach(() => {
      (Review.aggregate as jest.Mock).mockResolvedValue([]);
      (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (SignUp.findById as jest.Mock).mockReturnValue(
        selectResolving({ name: 'Asha Rao', profileImage: 'https://img/a.png' }),
      );
      (Order.findOne as jest.Mock).mockReturnValue(selectResolving(null));
    });

    it('upserts on (productId, userId) so a user keeps a single review per product', async () => {
      (Product.findById as jest.Mock).mockReturnValue(selectResolving({ userId: DEALER_ID }));
      (Review.findOneAndUpdate as jest.Mock).mockResolvedValue({
        _id: 'review1',
        productId: PRODUCT_ID,
        userId: USER_ID,
        userName: 'Asha Rao',
        rating: 4,
        comment: 'Solid build',
        isVerifiedPurchase: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await upsertProductReview(PRODUCT_ID, USER_ID, {
        rating: 4,
        comment: '  Solid build  ',
      });

      expect(result.review.rating).toBe(4);
      const [filter, update, options] = (Review.findOneAndUpdate as jest.Mock).mock.calls[0];
      expect(filter).toEqual({ productId: PRODUCT_ID, userId: USER_ID });
      expect(update).toMatchObject({ rating: 4, comment: 'Solid build' });
      expect(options).toMatchObject({ upsert: true });
    });

    it('flags a review as a verified purchase when a matching order exists', async () => {
      (Product.findById as jest.Mock).mockReturnValue(selectResolving({ userId: DEALER_ID }));
      (Order.findOne as jest.Mock).mockReturnValue(selectResolving({ _id: 'order1' }));
      (Review.findOneAndUpdate as jest.Mock).mockResolvedValue({
        _id: 'review1',
        productId: PRODUCT_ID,
        userId: USER_ID,
        userName: 'Asha Rao',
        rating: 5,
        isVerifiedPurchase: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await upsertProductReview(PRODUCT_ID, USER_ID, { rating: 5 });

      const [, update] = (Review.findOneAndUpdate as jest.Mock).mock.calls[0];
      expect(update.isVerifiedPurchase).toBe(true);
    });

    it('refuses a rating outside 1-5', async () => {
      (Product.findById as jest.Mock).mockReturnValue(selectResolving({ userId: DEALER_ID }));

      await expect(
        upsertProductReview(PRODUCT_ID, USER_ID, { rating: 6 }),
      ).rejects.toThrow('Rating must be a number between 1 and 5');
      expect(Review.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('refuses a non-numeric rating', async () => {
      (Product.findById as jest.Mock).mockReturnValue(selectResolving({ userId: DEALER_ID }));

      await expect(
        upsertProductReview(PRODUCT_ID, USER_ID, { rating: Number('abc') }),
      ).rejects.toThrow('Rating must be a number between 1 and 5');
    });

    it('stops a dealer from reviewing their own product', async () => {
      (Product.findById as jest.Mock).mockReturnValue(selectResolving({ userId: USER_ID }));

      await expect(
        upsertProductReview(PRODUCT_ID, USER_ID, { rating: 5 }),
      ).rejects.toThrow('You cannot review your own product');
      expect(Review.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('fails when the product does not exist', async () => {
      (Product.findById as jest.Mock).mockReturnValue(selectResolving(null));

      await expect(
        upsertProductReview(PRODUCT_ID, USER_ID, { rating: 5 }),
      ).rejects.toThrow('Product not found');
    });
  });

  describe('deleteProductReview', () => {
    it('recomputes the product rating after deleting the caller\'s review', async () => {
      (Review.findOneAndDelete as jest.Mock).mockResolvedValue({ _id: 'review1' });
      (Review.aggregate as jest.Mock).mockResolvedValue([]);
      (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const summary = await deleteProductReview(PRODUCT_ID, USER_ID);

      expect(Review.findOneAndDelete).toHaveBeenCalledWith({
        productId: PRODUCT_ID,
        userId: USER_ID,
      });
      expect(summary.reviewCount).toBe(0);
      expect(Product.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('fails when the caller has no review to delete', async () => {
      (Review.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(deleteProductReview(PRODUCT_ID, USER_ID)).rejects.toThrow('Review not found');
      expect(Product.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });
});
