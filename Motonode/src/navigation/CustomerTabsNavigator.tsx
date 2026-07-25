import React, { useCallback } from 'react';
import { StyleSheet, View, Platform, Pressable } from 'react-native';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { DesktopTopNav, type DesktopNavItem } from '@components/layout/DesktopTopNav';
import { CustomerStackRoutes, CustomerTabRoutes } from '@constants/routes';
import { useBreakpoint } from '@hooks/useBreakpoint';
import { useColors } from '@hooks/useColors';
import { CommunityScreen } from '@screens/customer/community/CommunityScreen';
import { GarageScreen } from '@screens/customer/garage/GarageScreen';
import { HomeScreen } from '@screens/customer/home/HomeScreen';
import { MarketplaceScreen } from '@screens/customer/marketplace/MarketplaceScreen';
import { CustomerProfileScreen } from '@screens/customer/profile/CustomerProfileScreen';
import { lightHaptic } from '@utils/haptics';

export type CustomerTabParamList = {
  [CustomerTabRoutes.Home]: undefined;
  [CustomerTabRoutes.Marketplace]: { initialTab?: number } | undefined;
  [CustomerTabRoutes.Community]: undefined;
  [CustomerTabRoutes.Garage]: { initialTab?: string } | undefined;
  [CustomerTabRoutes.Profile]: undefined;
};

const Tab = createBottomTabNavigator<CustomerTabParamList>();

const TAB_LABELS: Record<string, string> = {
  [CustomerTabRoutes.Home]: 'Home',
  [CustomerTabRoutes.Marketplace]: 'Marketplace',
  [CustomerTabRoutes.Community]: 'Community',
  [CustomerTabRoutes.Garage]: 'Drive',
  [CustomerTabRoutes.Profile]: 'Profile',
};

const ICON_MAP: Record<string, string> = {
  [CustomerTabRoutes.Home]: 'home',
  [CustomerTabRoutes.Marketplace]: 'shopping-bag',
  [CustomerTabRoutes.Community]: 'users',
  [CustomerTabRoutes.Garage]: 'truck',
  [CustomerTabRoutes.Profile]: 'user',
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const bottomInset = insets.bottom > 0 ? insets.bottom : Platform.OS === 'ios' ? 20 : 8;

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
        <View style={[styles.cutoutOverlay, { backgroundColor: colors.background }]} />

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            lightHaptic();
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (route.name === CustomerTabRoutes.Community) {
            return (
              <Pressable key={route.key} onPress={onPress} style={styles.middleTabBtnWrapper}>
                <View
                  style={[
                    styles.raisedCircle,
                    { backgroundColor: isFocused ? colors.primaryDark : colors.primary },
                  ]}
                >
                  <Feather name="users" size={20} color={colors.white} />
                </View>
                {isFocused ? (
                  <View
                    style={[
                      styles.activeDot,
                      styles.middleActiveDot,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                ) : null}
              </Pressable>
            );
          }

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.normalTabBtn}>
              <Feather
                name={(ICON_MAP[route.name] ?? 'circle') as 'home'}
                size={22}
                color={isFocused ? colors.primary : colors.textTertiary}
              />
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

function CustomerDesktopChrome({ state, navigation }: BottomTabBarProps) {
  const stackNav =
    useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();

  const items: DesktopNavItem[] = state.routes.map((route, index) => ({
    key: route.key,
    label: TAB_LABELS[route.name] ?? route.name,
    icon: ICON_MAP[route.name] ?? 'circle',
    focused: state.index === index,
    onPress: () => {
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

  return (
    <DesktopTopNav
      items={items}
      showCustomerActions
      onCartPress={() => stackNav.navigate(CustomerStackRoutes.Cart)}
      onNotificationsPress={() => stackNav.navigate(CustomerStackRoutes.Notifications)}
    />
  );
}

function CustomerTabLayout(props: BottomTabBarProps) {
  const { isDesktop } = useBreakpoint();
  if (isDesktop) {
    return <CustomerDesktopChrome {...props} />;
  }
  return <CustomTabBar {...props} />;
}

export function CustomerTabsNavigator() {
  const { isDesktop } = useBreakpoint();

  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => <CustomerTabLayout {...props} />,
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
      <Tab.Screen name={CustomerTabRoutes.Home} component={HomeScreen} />
      <Tab.Screen name={CustomerTabRoutes.Marketplace} component={MarketplaceScreen} />
      <Tab.Screen name={CustomerTabRoutes.Community} component={CommunityScreen} />
      <Tab.Screen name={CustomerTabRoutes.Garage} component={GarageScreen} />
      <Tab.Screen name={CustomerTabRoutes.Profile} component={CustomerProfileScreen} />
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
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-start',
    paddingTop: 10,
    overflow: 'visible',
  },
  cutoutOverlay: {
    position: 'absolute',
    top: -18,
    left: '50%',
    marginLeft: -36,
    width: 72,
    height: 36,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  normalTabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  middleTabBtnWrapper: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -28,
  },
  raisedCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  middleActiveDot: {
    marginTop: 6,
  },
});
