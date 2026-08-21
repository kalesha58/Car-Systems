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
import { ChromeHeader } from '@components/common';
import { useColors } from '@hooks/useColors';
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
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader style={styles.header} contentPad={8}>
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            lightHaptic();
            onBack();
          }}
        >
          <Feather name="chevron-left" size={24} color={colors.headerForeground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>{title}</Text>
        <View style={styles.headerSpacer} />
      </ChromeHeader>

      <View style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <BookingMasterStepBar current={step} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, contentContainerStyle]}
      >
        {children}
      </ScrollView>

      {(showContinue || footerExtra) && (
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
          {showContinue && onContinue && (
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
              <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  headerSpacer: { width: 44 },
  content: { padding: 16, paddingBottom: 24, gap: 14 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  ctaBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
});
