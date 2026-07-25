import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

import { CustomerStackRoutes } from '@constants/routes';
import { useToast } from '@context/index';
import { useColors } from '@hooks/useColors';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationSettings,
  updateNotificationSettings,
  type NotificationSettings,
} from '@services/profile.service';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { lightHaptic } from '@utils/haptics';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.CustomerNotificationSettings
>;

type SettingKey = keyof NotificationSettings;

type ToggleRow = {
  key: SettingKey;
  icon: string;
  title: string;
  subtitle: string;
};

const PUSH_ROWS: ToggleRow[] = [
  {
    key: 'pushEnabled',
    icon: 'bell',
    title: 'Push Notifications',
    subtitle: 'Master switch for all push alerts',
  },
  {
    key: 'orderUpdates',
    icon: 'shopping-bag',
    title: 'Order Updates',
    subtitle: 'Order confirmations, shipping and delivery',
  },
  {
    key: 'bookingUpdates',
    icon: 'calendar',
    title: 'Bookings & Test Drives',
    subtitle: 'Service bookings and test drive status',
  },
  {
    key: 'communityActivity',
    icon: 'users',
    title: 'Community Activity',
    subtitle: 'Likes, comments and replies on your posts',
  },
  {
    key: 'promotions',
    icon: 'percent',
    title: 'Offers & Promotions',
    subtitle: 'Deals, discounts and recommendations',
  },
];

const EMAIL_ROWS: ToggleRow[] = [
  {
    key: 'emailUpdates',
    icon: 'mail',
    title: 'Email Updates',
    subtitle: 'Receive order and account updates by email',
  },
];

export function CustomerNotificationSettingsScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const result = await getNotificationSettings();
        if (!cancelled) setSettings(result);
      } catch (error) {
        if (!cancelled) {
          showToast(getApiErrorMessage(error, 'Failed to load notification settings'), 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  /** Optimistically flips the switch and reverts if the server rejects it. */
  const handleToggle = async (key: SettingKey, value: boolean) => {
    lightHaptic();
    const previous = settings;
    setSettings({ ...settings, [key]: value });

    try {
      const saved = await updateNotificationSettings({ [key]: value });
      setSettings(saved);
    } catch (error) {
      setSettings(previous);
      showToast(getApiErrorMessage(error, 'Failed to save preference'), 'error');
    }
  };

  const renderRows = (rows: ToggleRow[]) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {rows.map((row, index) => {
        // Everything except the master switch is inert while push is off.
        const disabled = row.key !== 'pushEnabled' && row.key !== 'emailUpdates' && !settings.pushEnabled;

        return (
          <View
            key={row.key}
            style={[
              styles.row,
              index < rows.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.divider,
              },
              disabled && styles.rowDisabled,
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}>
              <Feather name={row.icon as 'bell'} size={16} color={colors.icon} />
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{row.title}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{row.subtitle}</Text>
            </View>
            <Switch
              value={settings[row.key]}
              disabled={disabled}
              onValueChange={(value) => void handleToggle(row.key, value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Notification Preferences</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.groupHeading, { color: colors.textSecondary }]}>
            PUSH NOTIFICATIONS
          </Text>
          {renderRows(PUSH_ROWS)}

          <Text style={[styles.groupHeading, { color: colors.textSecondary }]}>EMAIL</Text>
          {renderRows(EMAIL_ROWS)}
        </ScrollView>
      )}
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
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  headerSpacer: { width: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 10 },
  groupHeading: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
    marginTop: 8,
    paddingLeft: 4,
  },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowDisabled: { opacity: 0.5 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 2 },
});
