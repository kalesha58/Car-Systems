import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { CustomerStackRoutes } from '@constants/routes';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import { useTheme } from '@context/ThemeContext';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

type SettingsRoute =
  | typeof CustomerStackRoutes.CustomerNotificationSettings
  | typeof CustomerStackRoutes.BlockedAccounts
  | typeof CustomerStackRoutes.ChangePassword
  | typeof CustomerStackRoutes.AppPermissions
  | typeof CustomerStackRoutes.TermsConditions
  | typeof CustomerStackRoutes.CustomerHelpSupport
  | typeof CustomerStackRoutes.DeleteAccount;

type MenuRow = {
  icon: string;
  label: string;
  sublabel: string;
  route: SettingsRoute;
  destructive?: boolean;
};

type MenuSection = {
  title: string;
  rows: MenuRow[];
};

/**
 * Account-level items (profile, addresses, wishlist) live on the Profile
 * screen; this screen owns preferences, privacy, and account lifecycle.
 */
const SETTINGS_SECTIONS: MenuSection[] = [
  {
    title: 'Preferences',
    rows: [
      {
        icon: 'bell',
        label: 'Notification Preferences',
        sublabel: 'Choose which alerts you receive',
        route: CustomerStackRoutes.CustomerNotificationSettings,
      },
    ],
  },
  {
    title: 'Privacy & Security',
    rows: [
      {
        icon: 'slash',
        label: 'Blocked Accounts',
        sublabel: 'Review and unblock accounts',
        route: CustomerStackRoutes.BlockedAccounts,
      },
      {
        icon: 'lock',
        label: 'Change Password',
        sublabel: 'Update your account password',
        route: CustomerStackRoutes.ChangePassword,
      },
      {
        icon: 'shield',
        label: 'Permissions',
        sublabel: 'Camera, location, photos and alerts',
        route: CustomerStackRoutes.AppPermissions,
      },
    ],
  },
  {
    title: 'Support & Legal',
    rows: [
      {
        icon: 'help-circle',
        label: 'Help & Support',
        sublabel: 'Get help or contact our team',
        route: CustomerStackRoutes.CustomerHelpSupport,
      },
      {
        icon: 'file-text',
        label: 'Terms & Conditions',
        sublabel: 'Terms of use and privacy policy',
        route: CustomerStackRoutes.TermsConditions,
      },
    ],
  },
  {
    title: 'Account',
    rows: [
      {
        icon: 'user-x',
        label: 'Deactivate or Delete Account',
        sublabel: 'Pause or permanently remove your account',
        route: CustomerStackRoutes.DeleteAccount,
        destructive: true,
      },
    ],
  },
];

export function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isDark, setTheme } = useTheme();
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
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>APPEARANCE</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}>
                <Feather name={isDark ? 'moon' : 'sun'} size={18} color={colors.icon} />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>Dark Mode</Text>
                <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
                  Switch between light and dark themes
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={(value) => {
                  lightHaptic();
                  setTheme(value ? 'dark' : 'light');
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {SETTINGS_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
              {section.title.toUpperCase()}
            </Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {section.rows.map((row, index) => (
                <Pressable
                  key={row.route}
                  style={({ pressed }) => [
                    styles.row,
                    index < section.rows.length - 1 && {
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
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: row.destructive ? colors.destructive + '1A' : colors.muted },
                    ]}
                  >
                    <Feather
                      name={row.icon as 'user'}
                      size={18}
                      color={row.destructive ? colors.destructive : colors.icon}
                    />
                  </View>
                  <View style={styles.textWrap}>
                    <Text
                      style={[
                        styles.label,
                        { color: row.destructive ? colors.destructive : colors.textPrimary },
                      ]}
                    >
                      {row.label}
                    </Text>
                    <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
                      {row.sublabel}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

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
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
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
    marginTop: 4,
  },
});
