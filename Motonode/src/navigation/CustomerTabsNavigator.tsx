import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';

import { CustomerTabRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import { CommunityScreen } from '@screens/customer/community/CommunityScreen';
import { GarageScreen } from '@screens/customer/garage/GarageScreen';
import { HomeScreen } from '@screens/customer/home/HomeScreen';
import { MarketplaceScreen } from '@screens/customer/marketplace/MarketplaceScreen';
import { CustomerProfileScreen } from '@screens/customer/profile/CustomerProfileScreen';

export type CustomerTabParamList = {
  [CustomerTabRoutes.Home]: undefined;
  [CustomerTabRoutes.Marketplace]: undefined;
  [CustomerTabRoutes.Garage]: undefined;
  [CustomerTabRoutes.Community]: undefined;
  [CustomerTabRoutes.Profile]: undefined;
};

const Tab = createBottomTabNavigator<CustomerTabParamList>();

export function CustomerTabsNavigator() {
  const colors = useColors();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, string> = {
            [CustomerTabRoutes.Home]: 'home',
            [CustomerTabRoutes.Marketplace]: 'shopping-bag',
            [CustomerTabRoutes.Garage]: 'tool',
            [CustomerTabRoutes.Community]: 'users',
            [CustomerTabRoutes.Profile]: 'user',
          };
          return <Feather name={iconMap[route.name] ?? 'circle'} size={size} color={color} />;
        },
      })}>
      <Tab.Screen name={CustomerTabRoutes.Home} component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen
        name={CustomerTabRoutes.Marketplace}
        component={MarketplaceScreen}
        options={{ title: 'Market' }}
      />
      <Tab.Screen name={CustomerTabRoutes.Garage} component={GarageScreen} options={{ title: 'Garage' }} />
      <Tab.Screen
        name={CustomerTabRoutes.Community}
        component={CommunityScreen}
        options={{ title: 'Community' }}
      />
      <Tab.Screen
        name={CustomerTabRoutes.Profile}
        component={CustomerProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
