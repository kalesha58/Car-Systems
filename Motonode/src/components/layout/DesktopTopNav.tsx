import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { MotonodeAppLogo } from '@assets/images/brand';
import { ContentContainer } from '@components/layout/ContentContainer';
import { useCart } from '@context/CartContext';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

export type DesktopNavItem = {
  key: string;
  label: string;
  icon: string;
  focused: boolean;
  onPress: () => void;
};

type DesktopTopNavProps = {
  items: DesktopNavItem[];
  /** Optional actions shown on the right (cart, notifications). */
  showCustomerActions?: boolean;
  onCartPress?: () => void;
  onNotificationsPress?: () => void;
};

/**
 * Sticky top navigation for large screens (lg+). Replaces bottom tabs.
 * Web-only chrome — not used on Android/iOS.
 */
export function DesktopTopNav({
  items,
  showCustomerActions = false,
  onCartPress,
  onNotificationsPress,
}: DesktopTopNavProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { count } = useCart();
  const topPad = Platform.OS === 'web' ? 0 : insets.top;

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          paddingTop: topPad,
        },
      ]}
    >
      <ContentContainer style={styles.inner} padded>
        <View style={styles.brandRow}>
          <Image source={MotonodeAppLogo} style={styles.logo} resizeMode="contain" />
          <View style={styles.brandText}>
            <Text style={[styles.brand, { color: colors.textPrimary }]}>MOTONODE</Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              DRIVE TRUST, GROW TOGETHER
            </Text>
          </View>
        </View>

        <View style={styles.links}>
          {items.map(item => {
            const active = item.focused;
            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  lightHaptic();
                  item.onPress();
                }}
                style={[
                  styles.link,
                  active && { backgroundColor: colors.primarySubtle },
                ]}
              >
                <Feather
                  name={item.icon as 'home'}
                  size={18}
                  color={active ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.linkLabel,
                    { color: active ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {showCustomerActions ? (
          <View style={styles.actions}>
            {onNotificationsPress ? (
              <Pressable style={styles.iconBtn} onPress={onNotificationsPress} hitSlop={8}>
                <Feather name="bell" size={22} color={colors.textPrimary} />
              </Pressable>
            ) : null}
            {onCartPress ? (
              <Pressable style={styles.iconBtn} onPress={onCartPress} hitSlop={8}>
                <Feather name="shopping-cart" size={22} color={colors.textPrimary} />
                {count > 0 ? (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
                  </View>
                ) : null}
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.actionsSpacer} />
        )}
      </ContentContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 20,
    ...(Platform.OS === 'web'
      ? ({
          position: 'sticky' as unknown as 'absolute',
          top: 0,
        } as object)
      : null),
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    gap: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 200,
  },
  logo: { width: 40, height: 40 },
  brandText: { justifyContent: 'center' },
  brand: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
  tagline: {
    fontSize: 8,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  links: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  linkLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 96,
    justifyContent: 'flex-end',
  },
  actionsSpacer: { minWidth: 96 },
  iconBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold' },
});
