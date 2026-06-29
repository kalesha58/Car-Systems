import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CustomerStackRoutes } from '@constants/routes';
import { AiScreen } from '@screens/customer/ai/AiScreen';
import { CartScreen } from '@screens/customer/marketplace/CartScreen';
import { ProductDetailScreen } from '@screens/customer/marketplace/ProductDetailScreen';
import { VehicleDetailScreen } from '@screens/customer/marketplace/VehicleDetailScreen';
import { NotificationsScreen } from '@screens/shared/NotificationsScreen';
import { SearchScreen } from '@screens/shared/SearchScreen';
import { CustomerTabsNavigator } from './CustomerTabsNavigator';

export type CustomerStackParamList = {
  [CustomerStackRoutes.CustomerTabs]: undefined;
  [CustomerStackRoutes.Cart]: undefined;
  [CustomerStackRoutes.Search]: undefined;
  [CustomerStackRoutes.Notifications]: undefined;
  [CustomerStackRoutes.ProductDetail]: { id: string };
  [CustomerStackRoutes.VehicleDetail]: { id: string };
  [CustomerStackRoutes.AiAssistant]: undefined;
};

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export function CustomerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={CustomerStackRoutes.CustomerTabs} component={CustomerTabsNavigator} />
      <Stack.Screen name={CustomerStackRoutes.Cart} component={CartScreen} />
      <Stack.Screen name={CustomerStackRoutes.Search} component={SearchScreen} />
      <Stack.Screen name={CustomerStackRoutes.Notifications} component={NotificationsScreen} />
      <Stack.Screen name={CustomerStackRoutes.ProductDetail} component={ProductDetailScreen} />
      <Stack.Screen name={CustomerStackRoutes.VehicleDetail} component={VehicleDetailScreen} />
      <Stack.Screen
        name={CustomerStackRoutes.AiAssistant}
        component={AiScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
