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

import { BookingMasterStepBar, type BookingMasterStep } from '@components/booking/BookingMasterStepBar';
import { lightHaptic } from '@utils/haptics';

interface BookingFlowShellProps {
  title?: string;
  step: BookingMasterStep;
  onBack: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  showContinue?: boolean;
  footerExtra?: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function BookingFlowShell({
  title = 'Book Service',
  step,
  onBack,
  onContinue,
  continueLabel = 'Continue',
  continueDisabled = false,
  showContinue = true,
  footerExtra,
  contentContainerStyle,
  children,
}: BookingFlowShellProps) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            lightHaptic();
            onBack();
          }}
        >
          <Feather name="chevron-left" size={24} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <BookingMasterStepBar current={step} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, contentContainerStyle]}
      >
        {children}
      </ScrollView>

      {(showContinue || footerExtra) && (
        <View style={[styles.footer, { paddingBottom: bottomPad + 12 }]}>
          {footerExtra}
          {showContinue && onContinue && (
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
              <Feather name="arrow-right" size={18} color="#ffffff" />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 4,
    backgroundColor: '#ffffff',
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  headerSpacer: { width: 44 },
  content: { padding: 16, paddingBottom: 24, gap: 14 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  ctaBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#E60012',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaBtnDisabled: { backgroundColor: '#93C5FD' },
  ctaText: { color: '#ffffff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
