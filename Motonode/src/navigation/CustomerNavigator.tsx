import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CustomerStackRoutes } from '@constants/routes';
import { AiScreen } from '@screens/customer/ai/AiScreen';
import { CartScreen } from '@screens/customer/marketplace/CartScreen';
import { CheckoutScreen } from '@screens/customer/marketplace/CheckoutScreen';
import { PaymentScreen } from '@screens/customer/marketplace/PaymentScreen';
import { ProductDetailScreen } from '@screens/customer/marketplace/ProductDetailScreen';
import { VehicleDetailScreen } from '@screens/customer/marketplace/VehicleDetailScreen';
import { DealerStoreScreen } from '@screens/customer/marketplace/DealerStoreScreen';
import { ServiceDetailScreen } from '@screens/customer/marketplace/ServiceDetailScreen';
import { DriveDetailScreen } from '@screens/customer/marketplace/DriveDetailScreen';
import { MyOrdersScreen } from '@screens/customer/marketplace/MyOrdersScreen';
import { OrderTrackingScreen } from '@screens/customer/marketplace/OrderTrackingScreen';
import { ServiceBookingAddonsScreen } from '@screens/customer/marketplace/booking/ServiceBookingAddonsScreen';
import { ServiceBookingConfirmedScreen } from '@screens/customer/marketplace/booking/ServiceBookingConfirmedScreen';
import { ServiceBookingMainScreen } from '@screens/customer/marketplace/booking/ServiceBookingMainScreen';
import { ServiceBookingLocationScreen } from '@screens/customer/marketplace/booking/ServiceBookingLocationScreen';
import { ServiceBookingPaymentScreen } from '@screens/customer/marketplace/booking/ServiceBookingPaymentScreen';
import { ServiceBookingSummaryScreen } from '@screens/customer/marketplace/booking/ServiceBookingSummaryScreen';
import { ServiceBookingTrackingScreen } from '@screens/customer/marketplace/booking/ServiceBookingTrackingScreen';
import { ServiceBookingVehicleScreen } from '@screens/customer/marketplace/booking/ServiceBookingVehicleScreen';
import { BookingDetailScreen } from '@screens/customer/bookings/BookingDetailScreen';
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
  [CustomerStackRoutes.DealerStore]: { id: string };
  [CustomerStackRoutes.ServiceDetail]: { id: string };
  [CustomerStackRoutes.DriveDetail]: { id: string };
  [CustomerStackRoutes.MyOrders]: undefined;
  [CustomerStackRoutes.OrderTracking]: { id: string };
  [CustomerStackRoutes.Checkout]: undefined;
  [CustomerStackRoutes.Payment]: undefined;
  [CustomerStackRoutes.ServiceBookingDateTime]: { serviceId: string };
  [CustomerStackRoutes.ServiceBookingVehicle]: undefined;
  [CustomerStackRoutes.ServiceBookingLocation]: undefined;
  [CustomerStackRoutes.ServiceBookingAddons]: undefined;
  [CustomerStackRoutes.ServiceBookingSummary]: undefined;
  [CustomerStackRoutes.ServiceBookingPayment]: undefined;
  [CustomerStackRoutes.ServiceBookingConfirmed]: { bookingId: string };
  [CustomerStackRoutes.ServiceBookingTracking]: { bookingId: string };
  [CustomerStackRoutes.BookingDetail]: { bookingId: string };
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
      <Stack.Screen name={CustomerStackRoutes.DealerStore} component={DealerStoreScreen} />
      <Stack.Screen name={CustomerStackRoutes.ServiceDetail} component={ServiceDetailScreen} />
      <Stack.Screen name={CustomerStackRoutes.DriveDetail} component={DriveDetailScreen} />
      <Stack.Screen name={CustomerStackRoutes.MyOrders} component={MyOrdersScreen} />
      <Stack.Screen name={CustomerStackRoutes.OrderTracking} component={OrderTrackingScreen} />
      <Stack.Screen name={CustomerStackRoutes.Checkout} component={CheckoutScreen} />
      <Stack.Screen name={CustomerStackRoutes.Payment} component={PaymentScreen} />
      <Stack.Screen
        name={CustomerStackRoutes.ServiceBookingDateTime}
        component={ServiceBookingMainScreen}
      />
      <Stack.Screen
        name={CustomerStackRoutes.ServiceBookingVehicle}
        component={ServiceBookingVehicleScreen}
      />
      <Stack.Screen
        name={CustomerStackRoutes.ServiceBookingLocation}
        component={ServiceBookingLocationScreen}
      />
      <Stack.Screen
        name={CustomerStackRoutes.ServiceBookingAddons}
        component={ServiceBookingAddonsScreen}
      />
      <Stack.Screen
        name={CustomerStackRoutes.ServiceBookingSummary}
        component={ServiceBookingSummaryScreen}
      />
      <Stack.Screen
        name={CustomerStackRoutes.ServiceBookingPayment}
        component={ServiceBookingPaymentScreen}
      />
      <Stack.Screen
        name={CustomerStackRoutes.ServiceBookingConfirmed}
        component={ServiceBookingConfirmedScreen}
      />
      <Stack.Screen
        name={CustomerStackRoutes.ServiceBookingTracking}
        component={ServiceBookingTrackingScreen}
      />
      <Stack.Screen
        name={CustomerStackRoutes.BookingDetail}
        component={BookingDetailScreen}
      />
      <Stack.Screen
        name={CustomerStackRoutes.AiAssistant}
        component={AiScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
