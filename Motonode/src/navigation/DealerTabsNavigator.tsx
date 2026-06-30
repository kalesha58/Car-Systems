import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { DealerTabRoutes } from '@constants/routes';
import { useDealer } from '@context/DealerContext';
import { useColors } from '@hooks/useColors';
import { useDealerOnboardingStatus } from '@hooks/useDealerOnboardingStatus';
import { DealerDashboardScreen } from '@screens/dealer/dashboard/DealerDashboardScreen';
import { DriveScreen } from '@screens/dealer/drive/DriveScreen';
import { InventoryScreen } from '@screens/dealer/inventory/InventoryScreen';
import { DealerOrdersScreen } from '@screens/dealer/orders/DealerOrdersScreen';
import { DealerProfileScreen } from '@screens/dealer/profile/DealerProfileScreen';
import { lightHaptic } from '@utils/haptics';
import { showRegistrationBlockedAlert } from '@utils/dealerRegistration';

export type DealerTabParamList = {
  [DealerTabRoutes.Dashboard]: undefined;
  [DealerTabRoutes.Inventory]: undefined;
  [DealerTabRoutes.Orders]: undefined;
  [DealerTabRoutes.Drive]: undefined;
  [DealerTabRoutes.Profile]: undefined;
};

const Tab = createBottomTabNavigator<DealerTabParamList>();

// Icon map for each dealer tab
const ICON_MAP: Record<string, string> = {
  [DealerTabRoutes.Dashboard]: 'grid',
  [DealerTabRoutes.Inventory]: 'package',
  [DealerTabRoutes.Orders]: 'shopping-cart',
  [DealerTabRoutes.Drive]: 'navigation',
  [DealerTabRoutes.Profile]: 'more-horizontal',
};

const LABEL_MAP: Record<string, string> = {
  [DealerTabRoutes.Dashboard]: 'Dashboard',
  [DealerTabRoutes.Inventory]: 'Inventory',
  [DealerTabRoutes.Orders]: 'Orders',
  [DealerTabRoutes.Drive]: 'Drive',
  [DealerTabRoutes.Profile]: 'More',
};

// The middle raised button route — Orders sits at index 2
const MIDDLE_ROUTE = DealerTabRoutes.Orders;

function DealerCustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { canAccessDealerApis, status } = useDealerOnboardingStatus();
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 20 : 8);

  // Dynamically calculate the horizontal center of the middle tab (Orders)
  const middleIndex = state.routes.findIndex(r => r.name === MIDDLE_ROUTE);
  let leftPercentage = '50%';
  if (middleIndex !== -1) {
    let totalFlex = 0;
    let flexBeforeMiddle = 0;
    state.routes.forEach((route, index) => {
      const isMiddle = route.name === MIDDLE_ROUTE;
      const flexVal = isMiddle ? 1.2 : 1;
      totalFlex += flexVal;
      if (index < middleIndex) {
        flexBeforeMiddle += flexVal;
      }
    });
    const middleFlexCenter = flexBeforeMiddle + 0.6; // 1.2 / 2
    leftPercentage = `${(middleFlexCenter / totalFlex) * 100}%`;
  }

  return (
    <View style={[styles.tabBarWrapper, { height: 60 + bottomInset }]}>
      {/* Main floating pill bar */}
      <View
        style={[
          styles.mainTabBar,
          {
            backgroundColor: colors.tabBar,
            borderColor: colors.border,
            paddingBottom: bottomInset,
          },
        ]}
      >
        {/* Concave cutout overlay so the raised button has a background notch */}
        <View style={[styles.cutoutOverlay, { backgroundColor: colors.background, left: leftPercentage as any }]} />

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const isMiddle = route.name === MIDDLE_ROUTE;

          const onPress = () => {
            lightHaptic();
            if (route.name === DealerTabRoutes.Inventory && !canAccessDealerApis) {
              showRegistrationBlockedAlert(status);
            }
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // ── Raised "Orders" centre button ──────────────────────────────
          if (isMiddle) {
            return (
              <Pressable key={route.key} onPress={onPress} style={styles.middleTabBtnWrapper}>
                <View
                  style={[
                    styles.raisedCircle,
                    { backgroundColor: isFocused ? colors.primaryDark : colors.primary },
                  ]}
                >
                  <Feather name="shopping-cart" size={20} color={colors.white} />
                </View>
                {/* Small label below raised circle */}
                <Text
                  style={[
                    styles.middleLabel,
                    { color: isFocused ? colors.primary : colors.textTertiary, marginTop: 28 },
                  ]}
                >
                  Orders
                </Text>
                {isFocused && (
                  <View style={[styles.activeDot, styles.middleActiveDot, { backgroundColor: colors.primary }]} />
                )}
              </Pressable>
            );
          }

          // ── Normal tab button ───────────────────────────────────────────
          return (
            <Pressable key={route.key} onPress={onPress} style={styles.normalTabBtn}>
              <Feather
                name={(ICON_MAP[route.name] ?? 'circle') as any}
                size={22}
                color={isFocused ? colors.primary : colors.textTertiary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? colors.primary : colors.textTertiary },
                ]}
                numberOfLines={1}
              >
                {LABEL_MAP[route.name] ?? route.name}
              </Text>
              {isFocused && (
                <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function DealerTabsNavigator() {
  const { capabilities } = useDealer();

  return (
    <Tab.Navigator
      tabBar={(props) => <DealerCustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name={DealerTabRoutes.Dashboard} component={DealerDashboardScreen} />
      <Tab.Screen name={DealerTabRoutes.Inventory} component={InventoryScreen} />
      <Tab.Screen name={DealerTabRoutes.Orders} component={DealerOrdersScreen} />
      {capabilities.hasDrive ? (
        <Tab.Screen name={DealerTabRoutes.Drive} component={DriveScreen} />
      ) : null}
      <Tab.Screen name={DealerTabRoutes.Profile} component={DealerProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  mainTabBar: {
    flex: 1,
    flexDirection: 'row',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
  },
  // Concave notch behind the raised button
  cutoutOverlay: {
    width: 66,
    height: 38,
    borderBottomLeftRadius: 33,
    borderBottomRightRadius: 33,
    position: 'absolute',
    top: -1,
    marginLeft: -33,
    zIndex: 0,
  },
  middleTabBtnWrapper: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
    position: 'relative',
    height: '100%',
    zIndex: 2,
  },
  raisedCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -24,
    shadowColor: '#E60012',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  middleLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  normalTabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 3,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
  middleActiveDot: {
    position: 'absolute',
    bottom: 6,
  },
});
