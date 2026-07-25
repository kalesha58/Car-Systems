import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@hooks/useColors';
import type { IReviewSummary } from '@app-types/review';

import { StarRating } from './StarRating';

interface RatingSummaryProps {
  summary: IReviewSummary;
}

const STAR_ROWS = [5, 4, 3, 2, 1];

export function RatingSummary({ summary }: RatingSummaryProps) {
  const colors = useColors();
  const { averageRating, reviewCount, distribution } = summary;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.scoreColumn}>
        <Text style={[styles.score, { color: colors.textPrimary }]}>
          {averageRating.toFixed(1)}
        </Text>
        <StarRating rating={averageRating} size={13} />
        <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
          {reviewCount === 1 ? '1 review' : `${reviewCount.toLocaleString('en-IN')} reviews`}
        </Text>
      </View>

      <View style={styles.barsColumn}>
        {STAR_ROWS.map((star) => {
          const count = distribution?.[String(star)] ?? 0;
          const percent = reviewCount > 0 ? (count / reviewCount) * 100 : 0;

          return (
            <View key={star} style={styles.barRow}>
              <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{star}</Text>
              <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${percent}%`, backgroundColor: colors.starActive },
                  ]}
                />
              </View>
              <Text style={[styles.barCount, { color: colors.textTertiary }]}>{count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  scoreColumn: { alignItems: 'center', gap: 4, minWidth: 78 },
  score: { fontSize: 30, fontFamily: 'Inter_700Bold', lineHeight: 34 },
  scoreLabel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  barsColumn: { flex: 1, gap: 5 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', width: 8 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barCount: { fontSize: 9, fontFamily: 'Inter_500Medium', width: 22, textAlign: 'right' },
});
