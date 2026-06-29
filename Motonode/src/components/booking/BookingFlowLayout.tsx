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
import LinearGradient from 'react-native-linear-gradient';

import { BookingStepBar, type BookingStep } from '@components/booking/BookingStepBar';
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
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1D4ED8', '#3B82F6']}
        style={[styles.header, { paddingTop: topPad + 10 }]}
      >
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            lightHaptic();
            onBack();
          }}
        >
          <Feather name="arrow-left" size={20} color="#ffffff" />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <View style={styles.stepBarWrap}>
        <BookingStepBar current={step} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, contentContainerStyle]}
      >
        {children}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 12 }]}>
        {footerExtra}
        <Pressable
          style={[styles.ctaBtn, continueDisabled && styles.ctaBtnDisabled]}
          onPress={() => {
            if (continueDisabled) return;
            lightHaptic();
            onContinue();
          }}
          disabled={continueDisabled}
        >
          <Text style={styles.ctaText}>{continueLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
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
    color: '#ffffff',
  },
  headerSpacer: { width: 36 },
  stepBarWrap: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  content: { padding: 16, paddingBottom: 24, gap: 16 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  ctaBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnDisabled: { backgroundColor: '#93C5FD' },
  ctaText: { color: '#ffffff', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
