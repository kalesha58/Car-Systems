import React, { useCallback } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { DesktopTopNav, type DesktopNavItem } from '@components/layout/DesktopTopNav';
import { DealerTabRoutes } from '@constants/routes';
import { useDealer } from '@context/DealerContext';
import { useBreakpoint } from '@hooks/useBreakpoint';
import { useColors } from '@hooks/useColors';
import { useDealerOnboardingStatus } from '@hooks/useDealerOnboardingStatus';
import { DealerBankScreen } from '@screens/dealer/bank/DealerBankScreen';
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
  [DealerTabRoutes.Bank]: undefined;
};

const Tab = createBottomTabNavigator<DealerTabParamList>();

const ICON_MAP: Record<string, string> = {
  [DealerTabRoutes.Dashboard]: 'grid',
  [DealerTabRoutes.Inventory]: 'package',
  [DealerTabRoutes.Orders]: 'shopping-cart',
  [DealerTabRoutes.Drive]: 'navigation',
  [DealerTabRoutes.Bank]: 'credit-card',
  [DealerTabRoutes.Profile]: 'user',
};

const LABEL_MAP: Record<string, string> = {
  [DealerTabRoutes.Dashboard]: 'Dashboard',
  [DealerTabRoutes.Inventory]: 'Inventory',
  [DealerTabRoutes.Orders]: 'Orders',
  [DealerTabRoutes.Drive]: 'Drive',
  [DealerTabRoutes.Bank]: 'Bank',
  [DealerTabRoutes.Profile]: 'Profile',
};

const MIDDLE_ROUTE = DealerTabRoutes.Orders;

function DealerCustomTabBar({ state, navigation }: BottomTabBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { canAccessDealerApis, status } = useDealerOnboardingStatus();
  const bottomInset = insets.bottom > 0 ? insets.bottom : Platform.OS === 'ios' ? 20 : 8;

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
    const middleFlexCenter = flexBeforeMiddle + 0.6;
    leftPercentage = `${(middleFlexCenter / totalFlex) * 100}%`;
  }

  return (
    <View style={[styles.tabBarWrapper, { height: 60 + bottomInset }]}>
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
        <View
          style={[
            styles.cutoutOverlay,
            { backgroundColor: colors.background, left: leftPercentage as `${number}%` },
          ]}
        />

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
                <Text
                  style={[
                    styles.middleLabel,
                    { color: isFocused ? colors.primary : colors.textTertiary, marginTop: 28 },
                  ]}
                >
                  Orders
                </Text>
                {isFocused ? (
                  <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
                ) : null}
              </Pressable>
            );
          }

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.normalTabBtn}>
              <Feather
                name={(ICON_MAP[route.name] ?? 'circle') as 'grid'}
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
              {isFocused ? (
                <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function DealerDesktopChrome({ state, navigation }: BottomTabBarProps) {
  const { canAccessDealerApis, status } = useDealerOnboardingStatus();

  const items: DesktopNavItem[] = state.routes.map((route, index) => ({
    key: route.key,
    label: LABEL_MAP[route.name] ?? route.name,
    icon: ICON_MAP[route.name] ?? 'circle',
    focused: state.index === index,
    onPress: () => {
      if (route.name === DealerTabRoutes.Inventory && !canAccessDealerApis) {
        showRegistrationBlockedAlert(status);
      }
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (state.index !== index && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    },
  }));

  return <DesktopTopNav items={items} />;
}

function DealerTabLayout(props: BottomTabBarProps) {
  const { isDesktop } = useBreakpoint();
  if (isDesktop) return <DealerDesktopChrome {...props} />;
  return <DealerCustomTabBar {...props} />;
}

export function DealerTabsNavigator() {
  const { capabilities } = useDealer();
  const { isDesktop } = useBreakpoint();

  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => <DealerTabLayout {...props} />,
    [],
  );

  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        tabBarPosition: isDesktop ? 'top' : 'bottom',
      }}
    >
      <Tab.Screen name={DealerTabRoutes.Dashboard} component={DealerDashboardScreen} />
      <Tab.Screen name={DealerTabRoutes.Inventory} component={InventoryScreen} />
      <Tab.Screen name={DealerTabRoutes.Orders} component={DealerOrdersScreen} />
      {capabilities.hasDrive ? (
        <Tab.Screen name={DealerTabRoutes.Drive} component={DriveScreen} />
      ) : null}
      <Tab.Screen name={DealerTabRoutes.Bank} component={DealerBankScreen} />
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
});
