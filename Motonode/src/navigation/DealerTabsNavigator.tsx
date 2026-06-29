import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';

import { DealerTabRoutes } from '@constants/routes';
import { useDealer } from '@context/DealerContext';
import { useColors } from '@hooks/useColors';
import { DealerDashboardScreen } from '@screens/dealer/dashboard/DealerDashboardScreen';
import { DriveScreen } from '@screens/dealer/drive/DriveScreen';
import { InventoryScreen } from '@screens/dealer/inventory/InventoryScreen';
import { DealerOrdersScreen } from '@screens/dealer/orders/DealerOrdersScreen';
import { DealerProfileScreen } from '@screens/dealer/profile/DealerProfileScreen';

export type DealerTabParamList = {
  [DealerTabRoutes.Dashboard]: undefined;
  [DealerTabRoutes.Inventory]: undefined;
  [DealerTabRoutes.Orders]: undefined;
  [DealerTabRoutes.Drive]: undefined;
  [DealerTabRoutes.Profile]: undefined;
};

const Tab = createBottomTabNavigator<DealerTabParamList>();

export function DealerTabsNavigator() {
  const colors = useColors();
  const { capabilities } = useDealer();

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
            [DealerTabRoutes.Dashboard]: 'grid',
            [DealerTabRoutes.Inventory]: 'package',
            [DealerTabRoutes.Orders]: 'shopping-cart',
            [DealerTabRoutes.Drive]: 'navigation',
            [DealerTabRoutes.Profile]: 'user',
          };
          return <Feather name={iconMap[route.name] ?? 'circle'} size={size} color={color} />;
        },
      })}>
      <Tab.Screen
        name={DealerTabRoutes.Dashboard}
        component={DealerDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name={DealerTabRoutes.Inventory}
        component={InventoryScreen}
        options={{ title: 'Inventory' }}
      />
      <Tab.Screen name={DealerTabRoutes.Orders} component={DealerOrdersScreen} options={{ title: 'Orders' }} />
      {capabilities.hasDrive ? (
        <Tab.Screen name={DealerTabRoutes.Drive} component={DriveScreen} options={{ title: 'Drive' }} />
      ) : null}
      <Tab.Screen
        name={DealerTabRoutes.Profile}
        component={DealerProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
