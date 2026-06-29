import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DealerStackRoutes } from '@constants/routes';
import { useDealer } from '@context/DealerContext';
import { ProductFormScreen } from '@screens/dealer/inventory/ProductFormScreen';
import { ServiceFormScreen } from '@screens/dealer/inventory/ServiceFormScreen';
import { VehicleFormScreen } from '@screens/dealer/inventory/VehicleFormScreen';
import { DealerTypeScreen } from '@screens/dealer/registration/DealerTypeScreen';
import { RegistrationScreen } from '@screens/dealer/registration/RegistrationScreen';
import { BankDetailsScreen } from '@screens/dealer/settings/BankDetailsScreen';
import { GSTInfoScreen } from '@screens/dealer/settings/GSTInfoScreen';
import { NotificationSettingsScreen } from '@screens/dealer/settings/NotificationSettingsScreen';
import { DealerBookingDetailScreen } from '@screens/dealer/bookings/DealerBookingDetailScreen';
import { DealerServiceBookingsScreen } from '@screens/dealer/bookings/DealerServiceBookingsScreen';
import { StoreSettingsScreen } from '@screens/dealer/settings/StoreSettingsScreen';
import { UPIAccountsScreen } from '@screens/dealer/settings/UPIAccountsScreen';
import { DealerTabsNavigator } from './DealerTabsNavigator';

export type DealerStackParamList = {
  [DealerStackRoutes.DealerTabs]: undefined;
  [DealerStackRoutes.DealerType]: undefined;
  [DealerStackRoutes.BusinessRegistration]: undefined;
  [DealerStackRoutes.ProductForm]: { id?: string };
  [DealerStackRoutes.VehicleForm]: { id?: string };
  [DealerStackRoutes.ServiceForm]: { id?: string };
  [DealerStackRoutes.StoreSettings]: undefined;
  [DealerStackRoutes.BankDetails]: undefined;
  [DealerStackRoutes.GSTInfo]: undefined;
  [DealerStackRoutes.UPIAccounts]: undefined;
  [DealerStackRoutes.NotificationSettings]: undefined;
  [DealerStackRoutes.ServiceBookings]: undefined;
  [DealerStackRoutes.DealerBookingDetail]: { bookingId: string };
};

const Stack = createNativeStackNavigator<DealerStackParamList>();

export function DealerNavigator() {
  const { registrationCompleted } = useDealer();
  const initialRoute = registrationCompleted
    ? DealerStackRoutes.DealerTabs
    : DealerStackRoutes.DealerType;

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name={DealerStackRoutes.DealerTabs} component={DealerTabsNavigator} />
      <Stack.Screen name={DealerStackRoutes.DealerType} component={DealerTypeScreen} />
      <Stack.Screen name={DealerStackRoutes.BusinessRegistration} component={RegistrationScreen} />
      <Stack.Screen name={DealerStackRoutes.ProductForm} component={ProductFormScreen} />
      <Stack.Screen name={DealerStackRoutes.VehicleForm} component={VehicleFormScreen} />
      <Stack.Screen name={DealerStackRoutes.ServiceForm} component={ServiceFormScreen} />
      <Stack.Screen name={DealerStackRoutes.StoreSettings} component={StoreSettingsScreen} />
      <Stack.Screen name={DealerStackRoutes.BankDetails} component={BankDetailsScreen} />
      <Stack.Screen name={DealerStackRoutes.GSTInfo} component={GSTInfoScreen} />
      <Stack.Screen name={DealerStackRoutes.UPIAccounts} component={UPIAccountsScreen} />
      <Stack.Screen name={DealerStackRoutes.NotificationSettings} component={NotificationSettingsScreen} />
      <Stack.Screen name={DealerStackRoutes.ServiceBookings} component={DealerServiceBookingsScreen} />
      <Stack.Screen name={DealerStackRoutes.DealerBookingDetail} component={DealerBookingDetailScreen} />
    </Stack.Navigator>
  );
}
