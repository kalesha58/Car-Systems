import React from 'react';
import { StyleSheet, View, Platform, Pressable, Text, Dimensions } from 'react-native';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { CustomerTabRoutes } from '@constants/routes';
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

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const iconMap: Record<string, string> = {
    [CustomerTabRoutes.Home]: 'home',
    [CustomerTabRoutes.Marketplace]: 'shopping-bag',
    [CustomerTabRoutes.Community]: 'users',
    [CustomerTabRoutes.Garage]: 'truck',
    [CustomerTabRoutes.Profile]: 'user',
  };

  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 20 : 8);

  return (
    <View style={[styles.tabBarWrapper, { height: 60 + bottomInset }]}>
      {/* Docked Tab Bar with Top Rounded Corners */}
      <View style={[styles.mainTabBar, { backgroundColor: colors.tabBar, borderColor: colors.border, paddingBottom: bottomInset }]}>
        
        {/* Concave Cutout Background Overlay (screen background color overlaying the tab bar top edge) */}
        <View style={[styles.cutoutOverlay, { backgroundColor: colors.background }]} />

        {/* Render Tab Buttons */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
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

          // Render Middle Raised Button
          if (route.name === CustomerTabRoutes.Community) {
            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={styles.middleTabBtnWrapper}
              >
                <View style={[
                  styles.raisedCircle,
                  { backgroundColor: isFocused ? colors.primaryDark : colors.primary }
                ]}>
                  <Feather name="users" size={20} color={colors.white} />
                </View>
                
                {/* Active Indicator dot under the raised button */}
                {isFocused && (
                  <View style={[styles.activeDot, styles.middleActiveDot, { backgroundColor: colors.primary }]} />
                )}
              </Pressable>
            );
          }

          // Render Normal Tab Button
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.normalTabBtn}
            >
              <Feather
                name={iconMap[route.name] ?? 'circle'}
                size={22}
                color={isFocused ? colors.primary : colors.textTertiary}
              />
              
              {/* Active Indicator Dot */}
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

export function CustomerTabsNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
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
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
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
    left: '50%',
    marginLeft: -33,
    zIndex: 0,
  },
  middleTabBtnWrapper: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  normalTabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 4,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  middleActiveDot: {
    position: 'absolute',
    bottom: 6,
  },
});
