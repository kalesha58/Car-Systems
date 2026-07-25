import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { BottomSheet } from '@components/bottomSheet';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';
import type { IReview } from '@app-types/review';

const MAX_COMMENT_LENGTH = 2000;

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent',
};

interface WriteReviewSheetProps {
  visible: boolean;
  productName: string;
  /** Existing review to edit; when set the sheet acts as an update form. */
  existingReview?: IReview | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}

export function WriteReviewSheet({
  visible,
  productName,
  existingReview,
  submitting = false,
  onClose,
  onSubmit,
}: WriteReviewSheetProps) {
  const colors = useColors();
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? '');

  useEffect(() => {
    if (visible) {
      setRating(existingReview?.rating ?? 0);
      setComment(existingReview?.comment ?? '');
    }
  }, [visible, existingReview]);

  const canSubmit = rating >= 1 && rating <= 5 && !submitting;

  return (
    <BottomSheet visible={visible} onClose={onClose} presentation="panel">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheetHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {existingReview ? 'Edit your review' : 'Write a review'}
            </Text>
            <Text style={[styles.productName, { color: colors.textSecondary }]} numberOfLines={1}>
              {productName}
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <Feather name="x" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.starPickerRow}>
          {[1, 2, 3, 4, 5].map(star => (
            <Pressable
              key={star}
              onPress={() => {
                lightHaptic();
                setRating(star);
              }}
              hitSlop={6}
            >
              <Feather
                name="star"
                size={32}
                color={star <= rating ? colors.starActive : colors.border}
              />
            </Pressable>
          ))}
        </View>
        <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>
          {rating > 0 ? RATING_LABELS[rating] : 'Tap to rate'}
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              borderColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
          placeholder="Share details of your experience (optional)"
          placeholderTextColor={colors.textTertiary}
          multiline
          textAlignVertical="top"
          maxLength={MAX_COMMENT_LENGTH}
          value={comment}
          onChangeText={setComment}
        />
        <Text style={[styles.counter, { color: colors.textTertiary }]}>
          {comment.length}/{MAX_COMMENT_LENGTH}
        </Text>

        <Pressable
          style={[
            styles.submitBtn,
            { backgroundColor: canSubmit ? colors.primary : colors.muted },
          ]}
          disabled={!canSubmit}
          onPress={() => {
            lightHaptic();
            onSubmit(rating, comment.trim());
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={[
                styles.submitText,
                { color: canSubmit ? '#fff' : colors.textTertiary },
              ]}
            >
              {existingReview ? 'Update review' : 'Submit review'}
            </Text>
          )}
        </Pressable>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  productName: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },
  starPickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  ratingLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 96,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 16,
  },
  counter: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'right', marginTop: 4 },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
});
