import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouchable} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrapper}
        >
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 },
            ]}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {existingReview ? 'Edit your review' : 'Write a review'}
              </Text>
              <Pressable hitSlop={8} onPress={onClose}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={[styles.productName, { color: colors.textSecondary }]} numberOfLines={2}>
              {productName}
            </Text>

            <View style={styles.starPickerRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  hitSlop={6}
                  onPress={() => {
                    lightHaptic();
                    setRating(star);
                  }}
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
              {rating > 0 ? RATING_LABELS[rating] : 'Tap a star to rate'}
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="Share what you liked or what could be better (optional)"
              placeholderTextColor={colors.textTertiary}
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={MAX_COMMENT_LENGTH}
              textAlignVertical="top"
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
              onPress={() => onSubmit(rating, comment.trim())}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Text
                  style={[
                    styles.submitText,
                    { color: canSubmit ? colors.primaryForeground : colors.textTertiary },
                  ]}
                >
                  {existingReview ? 'Update review' : 'Submit review'}
                </Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  backdropTouchable: { flex: 1 },
  sheetWrapper: { width: '100%' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
