import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { ChromeHeader } from '@components/common';
import { DealerStackRoutes } from '@constants/routes';
import { useAuth } from '@context/index';
import { useColors } from '@hooks/useColors';
import type { DealerStackParamList } from '@navigation/DealerNavigator';
import { lightHaptic } from '@utils/haptics';

type Props = NativeStackScreenProps<
  DealerStackParamList,
  typeof DealerStackRoutes.PrivacySecurity
>;

export function DealerPrivacySecurityScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [loginAlerts, setLoginAlerts] = useState(true);
  const [hidePhone, setHidePhone] = useState(false);

  const handleChangePassword = () => {
    lightHaptic();
    Alert.alert(
      'Change Password',
      'For security, password changes are handled via your registered email. Open support mail to request a reset link.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email Support',
          onPress: () => {
            void Linking.openURL(
              `mailto:support@motonode.com?subject=${encodeURIComponent('Dealer password reset')}&body=${encodeURIComponent(
                `Please help reset password for ${user?.email ?? 'my dealer account'}.`,
              )}`,
            );
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader contentPad={8}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Feather name="arrow-left" size={22} color={colors.headerForeground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>Privacy & Security</Text>
          <View style={styles.headerBtn} />
        </View>
      </ChromeHeader>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Account security</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable style={styles.row} onPress={handleChangePassword}>
            <View style={[styles.iconWrap, { backgroundColor: '#FEF2F2' }]}>
              <Feather name="lock" size={16} color="#E60012" />
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Change password</Text>
              <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
                Request a secure password reset
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textTertiary} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <Pressable
            style={styles.row}
            onPress={() => {
              lightHaptic();
              navigation.navigate(DealerStackRoutes.NotificationSettings);
            }}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Feather name="bell" size={16} color="#1E3A8A" />
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Notification settings</Text>
              <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
                Alerts for orders, bookings & payments
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textTertiary} />
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Privacy</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Feather name="shield" size={16} color="#059669" />
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Login alerts</Text>
              <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
                Notify when someone signs in to your account
              </Text>
            </View>
            <Switch
              value={loginAlerts}
              onValueChange={(v) => {
                lightHaptic();
                setLoginAlerts(v);
              }}
              trackColor={{ false: '#E2E8F0', true: '#E60012' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: '#F2F2F2' }]}>
              <Feather name="eye-off" size={16} color="#64748B" />
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Hide phone on store</Text>
              <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
                Customers contact you via Motonode chat only
              </Text>
            </View>
            <Switch
              value={hidePhone}
              onValueChange={(v) => {
                lightHaptic();
                setHidePhone(v);
              }}
              trackColor={{ false: '#E2E8F0', true: '#E60012' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Account</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable
            style={styles.row}
            onPress={() => {
              lightHaptic();
              navigation.navigate(DealerStackRoutes.DeleteAccount);
            }}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#FEF2F2' }]}>
              <Feather name="user-x" size={16} color="#E60012" />
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.label, { color: '#E60012' }]}>Deactivate or delete account</Text>
              <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
                Pause or permanently remove this dealer account
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textTertiary} />
          </Pressable>
        </View>

        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          Signed in as {user?.email || user?.phone || 'dealer account'}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Inter_700Bold' },
  content: { padding: 16, gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 6,
    marginBottom: 2,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 62 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, minWidth: 0 },
  label: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  sublabel: { fontSize: 10, marginTop: 2, lineHeight: 14 },
  hint: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 12,
  },
});
