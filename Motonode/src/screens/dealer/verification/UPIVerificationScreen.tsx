import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';

import { PrimaryButton, SecondaryButton } from '@components/buttons';
import { ChromeHeader } from '@components/common';
import { VerificationStepBar } from '@components/verification';
import { DealerStackRoutes } from '@constants/routes';
import { useToast } from '@context/ToastContext';
import { useColors } from '@hooks/useColors';
import type { DealerStackParamList } from '@navigation/DealerNavigator';
import {
  confirmUpiVerification,
  initiateUpiVerification,
  validateUpiFormat,
} from '@services/upi.service';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { lightHaptic, successHaptic } from '@utils/haptics';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

type Step =
  | 'enter'
  | 'confirm'
  | 'processing'
  | 'checkApp'
  | 'enterAmount'
  | 'confirming'
  | 'error';

type Props = NativeStackScreenProps<
  DealerStackParamList,
  typeof DealerStackRoutes.UPIVerification
>;

export function UPIVerificationScreen({ navigation, route }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const pulse = useRef(new Animated.Value(0.8)).current;

  const initialUpi = route.params?.upiId ?? '';
  const [step, setStep] = useState<Step>(initialUpi ? 'confirm' : 'enter');
  const [upiId, setUpiId] = useState(initialUpi);
  const [amount, setAmount] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [testAmount, setTestAmount] = useState(1.0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [upiError, setUpiError] = useState<string | null>(null);

  useEffect(() => {
    if (step !== 'processing' && step !== 'confirming') {
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.8, duration: 900, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [step, pulse]);

  const handleUpiChange = (value: string) => {
    setUpiId(value.toLowerCase());
    setUpiError(null);
    setErrorMessage(null);
  };

  const handleEnterNext = () => {
    const trimmed = upiId.trim();
    if (!validateUpiFormat(trimmed)) {
      setUpiError('Invalid UPI ID. Please check and try again.');
      return;
    }
    lightHaptic();
    setStep('confirm');
  };

  const handleSendTestAmount = async () => {
    lightHaptic();
    setStep('processing');
    setErrorMessage(null);

    try {
      const result = await initiateUpiVerification(upiId.trim());
      setVerificationId(result.verificationId);
      setTestAmount(result.testAmount);
      setTimeout(() => setStep('checkApp'), 1500);
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, 'Invalid UPI ID. Please check and try again.'));
      setStep('error');
    }
  };

  const handleConfirmAmount = async () => {
    const parsed = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (Number.isNaN(parsed)) {
      setErrorMessage('Please enter a valid amount');
      return;
    }

    lightHaptic();
    setStep('confirming');
    setErrorMessage(null);

    try {
      const result = await confirmUpiVerification({
        verificationId,
        amount: parsed,
        upiId: upiId.trim(),
      });

      if (!result.verified) {
        throw new Error('UPI verification failed');
      }

      successHaptic();
      navigation.replace(DealerStackRoutes.UPIVerificationSuccess, {
        upiId: result.upiId,
        accountHolderName: result.accountHolderName,
      });
    } catch (err) {
      const message = getApiErrorMessage(err, 'Incorrect amount. Please try again.');
      setErrorMessage(message);
      setStep('enterAmount');
      showToast(message, 'error');
    }
  };

  const renderEnter = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Add UPI ID</Text>
      <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>UPI ID</Text>
        <TextInput
          style={[styles.textInput, { color: colors.textPrimary }]}
          value={upiId}
          onChangeText={handleUpiChange}
          placeholder="example@upi"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      {upiError ? <Text style={styles.errorText}>{upiError}</Text> : null}
      <View style={[styles.infoBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name="info" size={16} color="#0D6EFD" />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          We will send a small test amount (₹1) to verify your UPI ID.
        </Text>
      </View>
      <PrimaryButton
        label="Validate UPI ID"
        onPress={handleEnterNext}
        disabled={!upiId.trim()}
        style={styles.fullBtn}
      />
    </View>
  );

  const renderConfirm = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Confirm UPI ID</Text>
      <View style={[styles.upiDisplayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.upiLogo}>
          <Text style={styles.upiLogoText}>UPI</Text>
        </View>
        <Text style={[styles.upiDisplayText, { color: colors.textPrimary }]}>{upiId}</Text>
      </View>
      <PrimaryButton label="Send Test Amount" onPress={handleSendTestAmount} style={styles.fullBtn} />
      <SecondaryButton label="Cancel" onPress={() => navigation.goBack()} style={styles.fullBtn} />
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.centerContent}>
      <Animated.View style={[styles.illustration, { opacity: pulse }]}>
        <Feather name="send" size={48} color="#E60012" />
      </Animated.View>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Sending Test Amount...</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Please check your UPI app.
      </Text>
      <VerificationStepBar steps={['Initiated', 'Processing', 'Completed']} activeIndex={1} />
    </View>
  );

  const renderCheckApp = () => (
    <View style={styles.centerContent}>
      <View style={[styles.illustration, { backgroundColor: '#28A74518' }]}>
        <Feather name="smartphone" size={48} color="#28A745" />
      </View>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Check Your UPI App</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Open Google Pay, PhonePe, or your UPI app and confirm you received ₹{testAmount.toFixed(2)}.
      </Text>
      <PrimaryButton
        label="I Have Received the Amount"
        onPress={() => {
          lightHaptic();
          setStep('enterAmount');
        }}
        style={styles.fullBtn}
      />
    </View>
  );

  const renderEnterAmount = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Confirm Received Amount</Text>
      <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount received</Text>
        <TextInput
          style={[styles.amountInput, { color: colors.textPrimary }]}
          value={amount}
          onChangeText={setAmount}
          placeholder="₹ 0.00"
          placeholderTextColor={colors.textTertiary}
          keyboardType="decimal-pad"
        />
      </View>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <View style={[styles.infoBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name="info" size={16} color="#0D6EFD" />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Example: If you received ₹1.00, enter 1.00
        </Text>
      </View>
      <PrimaryButton label="Confirm Amount" onPress={handleConfirmAmount} style={styles.fullBtn} />
    </View>
  );

  const renderConfirming = () => (
    <View style={styles.centerContent}>
      <ActivityIndicator size="large" color="#E60012" />
      <Text style={[styles.stepTitle, { color: colors.textPrimary, marginTop: spacing.lg }]}>
        Verifying UPI...
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.centerContent}>
      <View style={[styles.illustration, { backgroundColor: '#E6001218' }]}>
        <Feather name="alert-circle" size={48} color="#E60012" />
      </View>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Invalid UPI ID</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        {errorMessage ?? 'Please check and try again.'}
      </Text>
      <PrimaryButton
        label="Try Again"
        onPress={() => {
          setStep('enter');
          setErrorMessage(null);
        }}
        style={styles.fullBtn}
      />
    </View>
  );

  const headerTitle =
    step === 'enter'
      ? 'Add UPI ID'
      : step === 'confirm'
        ? 'Confirm UPI ID'
        : step === 'enterAmount'
          ? 'Confirm Received Amount'
          : 'Verify UPI';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#FFFFFF', '#F8F8F8']} style={StyleSheet.absoluteFill} />
      <ChromeHeader>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{headerTitle}</Text>
          <View style={{ width: 22 }} />
        </View>
      </ChromeHeader>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'enter' && renderEnter()}
          {step === 'confirm' && renderConfirm()}
          {step === 'processing' && renderProcessing()}
          {step === 'checkApp' && renderCheckApp()}
          {step === 'enterAmount' && renderEnterAmount()}
          {step === 'confirming' && renderConfirming()}
          {step === 'error' && renderError()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  stepContent: {
    gap: spacing.md,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xl,
  },
  stepTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  inputCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  inputLabel: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xs,
  },
  textInput: {
    fontSize: typography.fontSize.md,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  amountInput: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  upiDisplayCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  upiLogo: {
    backgroundColor: '#0D0D0D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  upiLogoText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.sm,
  },
  upiDisplayText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  illustration: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E6001218',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  fullBtn: {
    width: '100%',
    marginTop: spacing.sm,
  },
  errorText: {
    color: '#E60012',
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
});
