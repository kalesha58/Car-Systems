import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import type { IReview } from '@app-types/review';

import { StarRating } from './StarRating';

interface ReviewCardProps {
  review: IReview;
  isOwn?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

function formatReviewDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function ReviewCard({ review, isOwn = false, onEdit, onDelete }: ReviewCardProps) {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        {review.userImage ? (
          <Image source={{ uri: review.userImage }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.muted }]}>
            <Text style={[styles.avatarText, { color: colors.textSecondary }]}>
              {getInitials(review.userName)}
            </Text>
          </View>
        )}

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
              {isOwn ? 'You' : review.userName}
            </Text>
            {review.isVerifiedPurchase ? (
              <View style={[styles.verifiedBadge, { backgroundColor: colors.muted }]}>
                <Feather name="check-circle" size={9} color={colors.success} />
                <Text style={[styles.verifiedText, { color: colors.textSecondary }]}>Verified</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.metaRow}>
            <StarRating rating={review.rating} size={11} />
            <Text style={[styles.date, { color: colors.textTertiary }]}>
              {formatReviewDate(review.createdAt)}
            </Text>
          </View>
        </View>

        {isOwn ? (
          <View style={styles.actions}>
            {onEdit ? (
              <Pressable hitSlop={8} onPress={onEdit}>
                <Feather name="edit-2" size={14} color={colors.textSecondary} />
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable hitSlop={8} onPress={onDelete}>
                <Feather name="trash-2" size={14} color={colors.destructive} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {review.comment ? (
        <Text style={[styles.comment, { color: colors.textSecondary }]}>{review.comment}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  headerInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flexShrink: 1 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: { fontSize: 8, fontFamily: 'Inter_600SemiBold' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  date: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  comment: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    marginTop: 10,
  },
});
