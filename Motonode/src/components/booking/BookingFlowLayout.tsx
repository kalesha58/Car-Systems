import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { ChromeHeader } from '@components/common';

import { BookingStepBar, type BookingStep } from '@components/booking/BookingStepBar';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

interface BookingFlowLayoutProps {
  title: string;
  step: BookingStep;
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  footerExtra?: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function BookingFlowLayout({
  title,
  step,
  onBack,
  onContinue,
  continueLabel = 'Continue',
  continueDisabled = false,
  footerExtra,
  contentContainerStyle,
  children,
}: BookingFlowLayoutProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader style={styles.header} contentPad={10}>
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            lightHaptic();
            onBack();
          }}
        >
          <Feather name="arrow-left" size={20} color={colors.headerForeground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>{title}</Text>
        <View style={styles.headerSpacer} />
      </ChromeHeader>

      <View style={[styles.stepBarWrap, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <BookingStepBar current={step} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, contentContainerStyle]}
      >
        {children}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: bottomPad + 12,
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        ]}
      >
        {footerExtra}
        <Pressable
          style={[
            styles.ctaBtn,
            { backgroundColor: continueDisabled ? colors.disabled : colors.primary },
          ]}
          onPress={() => {
            if (continueDisabled) return;
            lightHaptic();
            onContinue();
          }}
          disabled={continueDisabled}
        >
          <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>{continueLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  headerSpacer: { width: 36 },
  stepBarWrap: {
    borderBottomWidth: 1,
  },
  content: { padding: 16, paddingBottom: 24, gap: 16 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  ctaBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
});
