import type { IPaginationResponse } from './dealer';

export interface IReview {
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
  /** Number of reviews per star value, keyed '1' through '5'. */
  distribution: Record<string, number>;
}

export interface IReviewsResponse {
  success: boolean;
  Response: {
    reviews: IReview[];
    summary: IReviewSummary;
    pagination: IPaginationResponse;
  };
}

export interface IReviewSummaryResponse {
  success: boolean;
  Response: IReviewSummary;
}

export interface IMyReviewResponse {
  success: boolean;
  Response: IReview | null;
}

export interface IUpsertReviewResponse {
  success: boolean;
  Response: {
    review: IReview;
    summary: IReviewSummary;
  };
}

export interface IUpsertReviewRequest {
  rating: number;
  comment?: string;
}

export const EMPTY_REVIEW_SUMMARY: IReviewSummary = {
  averageRating: 0,
  reviewCount: 0,
  distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
};
