import type {
  IMyReviewResponse,
  IReview,
  IReviewSummary,
  IReviewsResponse,
  IReviewSummaryResponse,
  IUpsertReviewRequest,
  IUpsertReviewResponse,
} from '../types/review';
import { EMPTY_REVIEW_SUMMARY } from '../types/review';

import { api } from './api';

export type { IReview, IReviewSummary } from '../types/review';

export async function getProductReviews(
  productId: string,
  query?: { page?: number; limit?: number },
): Promise<{ reviews: IReview[]; summary: IReviewSummary; total: number }> {
  const response = await api.get<IReviewsResponse>(`/user/products/${productId}/reviews`, {
    params: query || {},
  });

  const payload = response.data?.Response;

  return {
    reviews: payload?.reviews ?? [],
    summary: payload?.summary ?? EMPTY_REVIEW_SUMMARY,
    total: payload?.pagination?.total ?? payload?.reviews?.length ?? 0,
  };
}

export async function getProductReviewSummary(productId: string): Promise<IReviewSummary> {
  const response = await api.get<IReviewSummaryResponse>(
    `/user/products/${productId}/reviews/summary`,
  );
  return response.data?.Response ?? EMPTY_REVIEW_SUMMARY;
}

export async function getMyProductReview(productId: string): Promise<IReview | null> {
  const response = await api.get<IMyReviewResponse>(`/user/products/${productId}/reviews/me`);
  return response.data?.Response ?? null;
}

/** Creates the caller's review, or replaces it if they already reviewed. */
export async function submitProductReview(
  productId: string,
  data: IUpsertReviewRequest,
): Promise<{ review: IReview; summary: IReviewSummary }> {
  const response = await api.post<IUpsertReviewResponse>(
    `/user/products/${productId}/reviews`,
    data,
  );

  const payload = response.data?.Response;
  if (!payload?.review) {
    throw new Error('Failed to submit review');
  }

  return { review: payload.review, summary: payload.summary ?? EMPTY_REVIEW_SUMMARY };
}

export async function deleteProductReview(productId: string): Promise<IReviewSummary> {
  const response = await api.delete<IReviewSummaryResponse>(
    `/user/products/${productId}/reviews`,
  );
  return response.data?.Response ?? EMPTY_REVIEW_SUMMARY;
}
