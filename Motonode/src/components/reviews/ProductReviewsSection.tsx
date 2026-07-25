import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import { useToast } from '@context/index';
import {
  deleteProductReview,
  getMyProductReview,
  getProductReviews,
  submitProductReview,
} from '@services/review.service';
import type { IReview, IReviewSummary } from '@app-types/review';
import { EMPTY_REVIEW_SUMMARY } from '@app-types/review';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { lightHaptic, successHaptic } from '@utils/haptics';

import { RatingSummary } from './RatingSummary';
import { ReviewCard } from './ReviewCard';
import { WriteReviewSheet } from './WriteReviewSheet';

const PREVIEW_COUNT = 3;

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  /** Notifies the parent so the header rating can update after a change. */
  onSummaryChange?: (summary: IReviewSummary) => void;
}

export function ProductReviewsSection({
  productId,
  productName,
  onSummaryChange,
}: ProductReviewsSectionProps) {
  const colors = useColors();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<IReview[]>([]);
  const [summary, setSummary] = useState<IReviewSummary>(EMPTY_REVIEW_SUMMARY);
  const [myReview, setMyReview] = useState<IReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Held in a ref so an inline callback from the parent cannot retrigger `load`.
  const onSummaryChangeRef = useRef(onSummaryChange);
  onSummaryChangeRef.current = onSummaryChange;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [listResult, mine] = await Promise.all([
        getProductReviews(productId, { limit: 50 }),
        getMyProductReview(productId).catch(() => null),
      ]);

      setReviews(listResult.reviews);
      setSummary(listResult.summary);
      setMyReview(mine);
      onSummaryChangeRef.current?.(listResult.summary);
    } catch {
      setReviews([]);
      setSummary(EMPTY_REVIEW_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (rating: number, comment: string) => {
    try {
      setSubmitting(true);
      const result = await submitProductReview(productId, { rating, comment });
      successHaptic();
      setSheetVisible(false);
      showToast(myReview ? 'Review updated' : 'Thanks for your review!', 'success');
      setSummary(result.summary);
      onSummaryChangeRef.current?.(result.summary);
      await load();
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Failed to submit review'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete review', 'Are you sure you want to remove your review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const nextSummary = await deleteProductReview(productId);
            setSummary(nextSummary);
            onSummaryChangeRef.current?.(nextSummary);
            showToast('Review removed', 'success');
            await load();
          } catch (error) {
            showToast(getApiErrorMessage(error, 'Failed to delete review'), 'error');
          }
        },
      },
    ]);
  };

  const otherReviews = myReview ? reviews.filter((item) => item.id !== myReview.id) : reviews;
  const visibleReviews = expanded ? otherReviews : otherReviews.slice(0, PREVIEW_COUNT);
  const hiddenCount = otherReviews.length - visibleReviews.length;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Ratings &amp; Reviews
        </Text>
        <Pressable
          style={styles.writeBtn}
          onPress={() => {
            lightHaptic();
            setSheetVisible(true);
          }}
        >
          <Feather name={myReview ? 'edit-2' : 'edit-3'} size={12} color={colors.primary} />
          <Text style={[styles.writeBtnText, { color: colors.primary }]}>
            {myReview ? 'Edit review' : 'Write a review'}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : summary.reviewCount === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="message-square" size={28} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No reviews yet</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Be the first to review this product.
          </Text>
        </View>
      ) : (
        <>
          <RatingSummary summary={summary} />

          <View style={styles.list}>
            {myReview ? (
              <ReviewCard
                review={myReview}
                isOwn
                onEdit={() => setSheetVisible(true)}
                onDelete={handleDelete}
              />
            ) : null}

            {visibleReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </View>

          {hiddenCount > 0 ? (
            <Pressable style={styles.showMoreBtn} onPress={() => setExpanded(true)}>
              <Text style={[styles.showMoreText, { color: colors.primary }]}>
                Show {hiddenCount} more {hiddenCount === 1 ? 'review' : 'reviews'}
              </Text>
              <Feather name="chevron-down" size={14} color={colors.primary} />
            </Pressable>
          ) : null}
        </>
      )}

      <WriteReviewSheet
        visible={sheetVisible}
        productName={productName}
        existingReview={myReview}
        submitting={submitting}
        onClose={() => setSheetVisible(false)}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20, gap: 12 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  writeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  writeBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  loadingBox: { paddingVertical: 24, alignItems: 'center' },
  emptyBox: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginTop: 4 },
  emptyText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  list: { gap: 10 },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  showMoreText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
