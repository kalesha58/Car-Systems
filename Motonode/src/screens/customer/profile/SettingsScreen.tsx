import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { CustomerStackRoutes } from '@constants/routes';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

type MenuRow = {
  icon: string;
  label: string;
  sublabel: string;
  route:
    | typeof CustomerStackRoutes.PersonalInformation
    | typeof CustomerStackRoutes.Notifications
    | typeof CustomerStackRoutes.SavedAddresses
    | typeof CustomerStackRoutes.PaymentMethods
    | typeof CustomerStackRoutes.Wishlist;
};

const SETTINGS_ROWS: MenuRow[] = [
  {
    icon: 'user',
    label: 'Personal Information',
    sublabel: 'Name, email, and phone',
    route: CustomerStackRoutes.PersonalInformation,
  },
  {
    icon: 'bell',
    label: 'Notifications',
    sublabel: 'Push notification preferences',
    route: CustomerStackRoutes.Notifications,
  },
  {
    icon: 'map-pin',
    label: 'Saved Addresses',
    sublabel: 'Delivery and service addresses',
    route: CustomerStackRoutes.SavedAddresses,
  },
  {
    icon: 'credit-card',
    label: 'Payment Methods',
    sublabel: 'Cards and wallets at checkout',
    route: CustomerStackRoutes.PaymentMethods,
  },
  {
    icon: 'heart',
    label: 'Wishlist',
    sublabel: 'Items you have saved',
    route: CustomerStackRoutes.Wishlist,
  },
];

export function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<CustomerStackParamList>>();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {SETTINGS_ROWS.map((row, index) => (
            <Pressable
              key={row.route}
              style={({ pressed }) => [
                styles.row,
                index < SETTINGS_ROWS.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.divider,
                },
                { opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={() => {
                lightHaptic();
                navigation.navigate(row.route);
              }}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}>
                <Feather name={row.icon as 'user'} size={18} color={colors.icon} />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>{row.label}</Text>
                <Text style={[styles.sublabel, { color: colors.textSecondary }]}>{row.sublabel}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textTertiary} />
            </Pressable>
          ))}
        </View>

        <Text style={[styles.version, { color: colors.textTertiary }]}>Motonode v1.0.0</Text>
      </ScrollView>
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
  content: { padding: 16 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  label: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  sublabel: { fontSize: 10, marginTop: 2 },
  version: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 20,
  },
});
