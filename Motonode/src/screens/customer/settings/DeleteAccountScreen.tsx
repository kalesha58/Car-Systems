import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { CustomerStackRoutes } from '@constants/routes';
import { useAuth, useToast } from '@context/index';
import { useColors } from '@hooks/useColors';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import { deactivateAccount, deleteAccount } from '@services/profile.service';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { lightHaptic } from '@utils/haptics';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.DeleteAccount
>;

type AccountAction = 'deactivate' | 'delete';

const REASONS: Record<AccountAction, string[]> = {
  deactivate: [
    'I need a break from the app',
    'I get too many notifications',
    'I already bought what I needed',
    'I have privacy concerns',
    'Other',
  ],
  delete: [
    'I no longer need this account',
    'I have a duplicate account',
    'I had a bad experience with an order or service',
    'I have privacy or data concerns',
    'I found a better alternative',
    'Other',
  ],
};

const OTHER_REASON = 'Other';
const DELETE_CONFIRMATION = 'DELETE';

export function DeleteAccountScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { logout } = useAuth();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [action, setAction] = useState<AccountAction>('deactivate');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isDelete = action === 'delete';
  const resolvedReason =
    selectedReason === OTHER_REASON ? otherReason.trim() : (selectedReason ?? '');
  const confirmationValid =
    !isDelete || confirmation.trim().toUpperCase() === DELETE_CONFIRMATION;
  const canSubmit = Boolean(resolvedReason) && confirmationValid && !submitting;

  const switchAction = (next: AccountAction) => {
    lightHaptic();
    setAction(next);
    setSelectedReason(null);
    setOtherReason('');
    setConfirmation('');
  };

  const performAction = async () => {
    try {
      setSubmitting(true);
      if (isDelete) {
        await deleteAccount(resolvedReason);
        showToast('Your account has been deleted', 'success');
      } else {
        await deactivateAccount(resolvedReason);
        showToast('Your account has been deactivated', 'success');
      }
      await logout();
    } catch (error) {
      showToast(
        getApiErrorMessage(error, isDelete ? 'Failed to delete account' : 'Failed to deactivate account'),
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    lightHaptic();
    Alert.alert(
      isDelete ? 'Delete account permanently?' : 'Deactivate your account?',
      isDelete
        ? 'Your personal details will be removed and you will be signed out. This cannot be undone.'
        : 'You will be signed out and your profile hidden until you sign back in and reactivate.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isDelete ? 'Delete' : 'Deactivate',
          style: 'destructive',
          onPress: () => void performAction(),
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Deactivate or Delete</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            style={[
              styles.optionCard,
              {
                backgroundColor: colors.card,
                borderColor: !isDelete ? colors.primary : colors.border,
                borderWidth: !isDelete ? 2 : 1,
              },
            ]}
            onPress={() => switchAction('deactivate')}
          >
            <View style={styles.optionHeader}>
              <View style={[styles.optionIcon, { backgroundColor: colors.muted }]}>
                <Feather name="pause-circle" size={18} color={colors.icon} />
              </View>
              <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                Deactivate account
              </Text>
              <Feather
                name={!isDelete ? 'check-circle' : 'circle'}
                size={18}
                color={!isDelete ? colors.primary : colors.textTertiary}
              />
            </View>
            <Text style={[styles.optionBody, { color: colors.textSecondary }]}>
              Temporarily hides your profile and stops notifications. Your orders, vehicles and
              saved items are kept, and you can reactivate by signing back in.
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.optionCard,
              {
                backgroundColor: colors.card,
                borderColor: isDelete ? colors.destructive : colors.border,
                borderWidth: isDelete ? 2 : 1,
              },
            ]}
            onPress={() => switchAction('delete')}
          >
            <View style={styles.optionHeader}>
              <View style={[styles.optionIcon, { backgroundColor: colors.destructive + '1A' }]}>
                <Feather name="trash-2" size={18} color={colors.destructive} />
              </View>
              <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                Delete account
              </Text>
              <Feather
                name={isDelete ? 'check-circle' : 'circle'}
                size={18}
                color={isDelete ? colors.destructive : colors.textTertiary}
              />
            </View>
            <Text style={[styles.optionBody, { color: colors.textSecondary }]}>
              Permanently removes your personal details. Order and invoice records we are legally
              required to keep are retained without your personal information. This cannot be
              undone.
            </Text>
          </Pressable>

          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
            Why are you {isDelete ? 'deleting' : 'deactivating'} your account?
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {REASONS[action].map((reason, index) => {
              const selected = selectedReason === reason;
              return (
                <Pressable
                  key={reason}
                  style={[
                    styles.reasonRow,
                    index < REASONS[action].length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.divider,
                    },
                  ]}
                  onPress={() => {
                    lightHaptic();
                    setSelectedReason(reason);
                  }}
                >
                  <Feather
                    name={selected ? 'check-circle' : 'circle'}
                    size={18}
                    color={selected ? colors.primary : colors.textTertiary}
                  />
                  <Text style={[styles.reasonText, { color: colors.textPrimary }]}>{reason}</Text>
                </Pressable>
              );
            })}
          </View>

          {selectedReason === OTHER_REASON ? (
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              value={otherReason}
              onChangeText={setOtherReason}
              placeholder="Tell us a bit more"
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
          ) : null}

          {isDelete ? (
            <View style={styles.confirmBlock}>
              <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>
                Type {DELETE_CONFIRMATION} to confirm
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
                value={confirmation}
                onChangeText={setConfirmation}
                placeholder={DELETE_CONFIRMATION}
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              {
                backgroundColor: canSubmit
                  ? isDelete
                    ? colors.destructive
                    : colors.primary
                  : colors.muted,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            disabled={!canSubmit}
            onPress={handleSubmit}
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
                {isDelete ? 'Delete my account' : 'Deactivate my account'}
              </Text>
            )}
          </Pressable>

          <Pressable style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
              Keep my account
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  headerSpacer: { width: 32 },
  content: { padding: 16, gap: 12 },
  optionCard: { borderRadius: 16, padding: 14, gap: 8 },
  optionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: { flex: 1, fontSize: 14, fontFamily: 'Inter_700Bold' },
  optionBody: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  sectionLabel: { fontSize: 13, fontFamily: 'Inter_700Bold', marginTop: 6 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  reasonText: { flex: 1, fontSize: 12, fontFamily: 'Inter_500Medium' },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 88,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  confirmBlock: { gap: 6 },
  confirmLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  submitBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
