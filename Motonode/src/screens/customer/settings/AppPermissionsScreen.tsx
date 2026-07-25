import React, { useCallback, useState } from 'react';
import {
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { CustomerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import { hasPhotoPermission } from '@utils/photoPermissions';
import { lightHaptic } from '@utils/haptics';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.AppPermissions
>;

type PermissionKey = 'location' | 'camera' | 'photos' | 'notifications';

type PermissionState = 'granted' | 'denied' | 'unknown';

type PermissionRow = {
  key: PermissionKey;
  icon: string;
  title: string;
  reason: string;
};

const PERMISSION_ROWS: PermissionRow[] = [
  {
    key: 'location',
    icon: 'map-pin',
    title: 'Location',
    reason: 'Used to find nearby dealers and set delivery or service addresses.',
  },
  {
    key: 'camera',
    icon: 'camera',
    title: 'Camera',
    reason: 'Used to take photos for community posts and vehicle documents.',
  },
  {
    key: 'photos',
    icon: 'image',
    title: 'Photos',
    reason: 'Used to pick images you choose for posts and your profile.',
  },
  {
    key: 'notifications',
    icon: 'bell',
    title: 'Notifications',
    reason: 'Used to alert you about orders, bookings and messages.',
  },
];

/**
 * Read-only view of OS-level permission states. Permissions can only be
 * changed from system settings, so each row deep-links there.
 */
export function AppPermissionsScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [states, setStates] = useState<Record<PermissionKey, PermissionState>>({
    location: 'unknown',
    camera: 'unknown',
    photos: 'unknown',
    notifications: 'unknown',
  });

  const checkPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      // iOS has no synchronous check without prompting, so states stay unknown.
      return;
    }

    try {
      const [location, camera, photos, notifications] = await Promise.all([
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION),
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA),
        hasPhotoPermission('gallery'),
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          ? PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
          : Promise.resolve(true),
      ]);

      setStates({
        location: location ? 'granted' : 'denied',
        camera: camera ? 'granted' : 'denied',
        photos: photos ? 'granted' : 'denied',
        notifications: notifications ? 'granted' : 'denied',
      });
    } catch {
      // Leave states as-is; the settings link is still available.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void checkPermissions();
    }, [checkPermissions]),
  );

  const openSettings = () => {
    lightHaptic();
    void Linking.openSettings();
  };

  const renderBadge = (state: PermissionState) => {
    if (state === 'granted') {
      return (
        <View style={[styles.badge, { backgroundColor: colors.success + '1A' }]}>
          <Text style={[styles.badgeText, { color: colors.success }]}>Allowed</Text>
        </View>
      );
    }
    if (state === 'denied') {
      return (
        <View style={[styles.badge, { backgroundColor: colors.destructive + '1A' }]}>
          <Text style={[styles.badgeText, { color: colors.destructive }]}>Not allowed</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, { backgroundColor: colors.muted }]}>
        <Text style={[styles.badgeText, { color: colors.textSecondary }]}>Manage</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.header, paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Permissions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="info" size={16} color={colors.icon} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Permissions are managed by your device. Tap any item to open Motonode's system settings.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {PERMISSION_ROWS.map((row, index) => (
            <Pressable
              key={row.key}
              style={({ pressed }) => [
                styles.row,
                index < PERMISSION_ROWS.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.divider,
                },
                { opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={openSettings}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}>
                <Feather name={row.icon as 'bell'} size={16} color={colors.icon} />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>{row.title}</Text>
                <Text style={[styles.reason, { color: colors.textSecondary }]}>{row.reason}</Text>
              </View>
              {renderBadge(states[row.key])}
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.settingsBtn,
            { borderColor: colors.primary, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={openSettings}
        >
          <Feather name="external-link" size={16} color={colors.primary} />
          <Text style={[styles.settingsText, { color: colors.primary }]}>Open device settings</Text>
        </Pressable>
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
  content: { padding: 16, gap: 12 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  infoText: { flex: 1, fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  reason: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 2, lineHeight: 14 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 9, fontFamily: 'Inter_700Bold' },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  settingsText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
});
