import React, { useState } from 'react';
import {
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
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';
import type { DealerStackParamList } from '@navigation/DealerNavigator';

type Props = NativeStackScreenProps<DealerStackParamList, typeof DealerStackRoutes.NotificationSettings>;

type NotifRow = {
  id: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  enabled: boolean;
};

const PUSH_NOTIFICATIONS: NotifRow[] = [
  { id: 'orders', icon: 'shopping-bag', iconBg: '#F2F2F2', iconColor: '#E60012', title: 'Orders & Bookings', subtitle: 'Get notified for new orders and bookings', enabled: true },
  { id: 'inventory', icon: 'package', iconBg: '#F0FDF4', iconColor: '#10B981', title: 'Inventory Alerts', subtitle: 'Low stock and out of stock alerts', enabled: true },
  { id: 'payments', icon: 'dollar-sign', iconBg: '#F0FDF4', iconColor: '#059669', title: 'Payments & Settlements', subtitle: 'Payment received and settlement updates', enabled: true },
  { id: 'messages', icon: 'message-circle', iconBg: '#F2F2F2', iconColor: '#E60012', title: 'Customer Messages', subtitle: 'New messages from customers', enabled: true },
  { id: 'promotions', icon: 'percent', iconBg: '#FEF2F2', iconColor: '#EF4444', title: 'Promotions & Offers', subtitle: 'Updates on offers and promotions', enabled: false },
];

const EMAIL_NOTIFICATIONS: NotifRow[] = [
  { id: 'order_updates', icon: 'mail', iconBg: '#F2F2F2', iconColor: '#E60012', title: 'Order Updates', subtitle: 'Receive order updates via email', enabled: true },
  { id: 'weekly', icon: 'bar-chart-2', iconBg: '#F0FDF4', iconColor: '#10B981', title: 'Weekly Reports', subtitle: 'Get weekly business reports', enabled: true },
  { id: 'promo_email', icon: 'gift', iconBg: '#FFF7ED', iconColor: '#F59E0B', title: 'Promotions', subtitle: 'Receive promotional emails', enabled: false },
];

export function NotificationSettingsScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [pushSettings, setPushSettings] = useState<Record<string, boolean>>(
    Object.fromEntries(PUSH_NOTIFICATIONS.map((n) => [n.id, n.enabled]))
  );
  const [emailSettings, setEmailSettings] = useState<Record<string, boolean>>(
    Object.fromEntries(EMAIL_NOTIFICATIONS.map((n) => [n.id, n.enabled]))
  );

  const togglePush = (id: string) => {
    lightHaptic();
    setPushSettings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleEmail = (id: string) => {
    lightHaptic();
    setEmailSettings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNotifRow = (
    row: NotifRow,
    isEnabled: boolean,
    onToggle: (id: string) => void,
    isLast: boolean
  ) => (
    <View key={row.id}>
      <View style={styles.notifRow}>
        <View style={[styles.notifIconBox, { backgroundColor: row.iconBg }]}>
          <Feather name={row.icon as any} size={15} color={row.iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.notifTitle, { color: colors.textPrimary }]}>{row.title}</Text>
          <Text style={[styles.notifSubtitle, { color: colors.textSecondary }]}>{row.subtitle}</Text>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={() => onToggle(row.id)}
          trackColor={{ false: '#E2E8F0', true: '#E60012' }}
          thumbColor="#ffffff"
        />
      </View>
      {!isLast && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader contentPad={8}>
        <View style={styles.headerRow}>
          <Pressable style={styles.headerBtn} onPress={() => { lightHaptic(); navigation.goBack(); }}>
            <Feather name="arrow-left" size={22} color={colors.headerForeground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>Notification Settings</Text>
          <View style={styles.headerBtn} />
        </View>
      </ChromeHeader>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Push Notifications */}
        <Text style={[styles.groupHeading, { color: colors.textSecondary }]}>Push Notifications</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {PUSH_NOTIFICATIONS.map((row, idx) =>
            renderNotifRow(
              row,
              pushSettings[row.id],
              togglePush,
              idx === PUSH_NOTIFICATIONS.length - 1
            )
          )}
        </View>

        {/* Email Notifications */}
        <Text style={[styles.groupHeading, { color: colors.textSecondary }]}>Email Notifications</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {EMAIL_NOTIFICATIONS.map((row, idx) =>
            renderNotifRow(
              row,
              emailSettings[row.id],
              toggleEmail,
              idx === EMAIL_NOTIFICATIONS.length - 1
            )
          )}
        </View>
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
  groupHeading: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 4,
    marginBottom: 2,
  },
  card: {
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
  },
  notifRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  notifIconBox: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  notifSubtitle: { fontSize: 10, color: '#94A3B8', marginTop: 1, fontFamily: 'Inter_400Regular' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 12 },
});
