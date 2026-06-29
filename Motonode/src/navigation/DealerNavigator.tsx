import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DealerStackRoutes } from '@constants/routes';
import { useDealer } from '@context/DealerContext';
import { ProductFormScreen } from '@screens/dealer/inventory/ProductFormScreen';
import { ServiceFormScreen } from '@screens/dealer/inventory/ServiceFormScreen';
import { VehicleFormScreen } from '@screens/dealer/inventory/VehicleFormScreen';
import { DealerTypeScreen } from '@screens/dealer/registration/DealerTypeScreen';
import { RegistrationScreen } from '@screens/dealer/registration/RegistrationScreen';
import { DealerTabsNavigator } from './DealerTabsNavigator';

export type DealerStackParamList = {
  [DealerStackRoutes.DealerTabs]: undefined;
  [DealerStackRoutes.DealerType]: undefined;
  [DealerStackRoutes.BusinessRegistration]: undefined;
  [DealerStackRoutes.ProductForm]: { id?: string };
  [DealerStackRoutes.VehicleForm]: { id?: string };
  [DealerStackRoutes.ServiceForm]: { id?: string };
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
      <Stack.Screen
        name={DealerStackRoutes.BusinessRegistration}
        component={RegistrationScreen}
      />
      <Stack.Screen name={DealerStackRoutes.ProductForm} component={ProductFormScreen} />
      <Stack.Screen name={DealerStackRoutes.VehicleForm} component={VehicleFormScreen} />
      <Stack.Screen name={DealerStackRoutes.ServiceForm} component={ServiceFormScreen} />
    </Stack.Navigator>
  );
}
