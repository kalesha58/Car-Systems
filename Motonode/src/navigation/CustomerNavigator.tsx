import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CustomerStackRoutes } from '@constants/routes';
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
import { CreateCommunityPostScreen } from '@screens/customer/community/CreateCommunityPostScreen';
import { AddVehicleScreen } from '@screens/customer/garage/AddVehicleScreen';
import { GarageVehicleDetailScreen } from '@screens/customer/garage/GarageVehicleDetailScreen';
import { NotificationsScreen } from '@screens/shared/NotificationsScreen';
import { SearchScreen } from '@screens/shared/SearchScreen';
import {
  ChatListScreen,
  ChatScreen,
  CreateChatScreen,
  CreateGroupScreen,
  GroupInfoScreen,
  DealerChatScreen,
  AIChatScreen,
} from '@screens/shared/chat';
import {
  SavedAddressesScreen,
  AddAddressMethodScreen,
  AddLiveLocationScreen,
  ManualAddressScreen,
} from '@screens/customer/address';
import { WishlistScreen } from '@screens/customer/profile/WishlistScreen';
import { PaymentMethodsScreen } from '@screens/customer/profile/PaymentMethodsScreen';
import { PersonalInformationScreen } from '@screens/customer/profile/PersonalInformationScreen';
import { SettingsScreen } from '@screens/customer/profile/SettingsScreen';
import {
  BlockedAccountsScreen,
  ChangePasswordScreen,
  CustomerNotificationSettingsScreen,
  AppPermissionsScreen,
  TermsConditionsScreen,
  CustomerHelpSupportScreen,
  DeleteAccountScreen,
} from '@screens/customer/settings';
import { OtpVerificationScreen } from '@screens/customer/verification/OtpVerificationScreen';
import { OtpLoadingScreen } from '@screens/customer/verification/OtpLoadingScreen';
import { OtpSuccessScreen } from '@screens/customer/verification/OtpSuccessScreen';
import { CustomerTabsNavigator } from './CustomerTabsNavigator';
import type { IAddress } from '@app-types/address';

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
  [CustomerStackRoutes.Payment]: { address?: IAddress } | undefined;
  [CustomerStackRoutes.ServiceBookingDateTime]: { serviceId: string };
  [CustomerStackRoutes.ServiceBookingVehicle]: undefined;
  [CustomerStackRoutes.ServiceBookingLocation]: undefined;
  [CustomerStackRoutes.ServiceBookingAddons]: undefined;
  [CustomerStackRoutes.ServiceBookingSummary]: undefined;
  [CustomerStackRoutes.ServiceBookingPayment]: undefined;
  [CustomerStackRoutes.ServiceBookingConfirmed]: { bookingId: string };
  [CustomerStackRoutes.ServiceBookingTracking]: { bookingId: string };
  [CustomerStackRoutes.BookingDetail]: { bookingId: string };
  [CustomerStackRoutes.CreateCommunityPost]: undefined;
  [CustomerStackRoutes.AddVehicle]: undefined;
  [CustomerStackRoutes.GarageVehicleDetail]: {
    vehicleId: string;
    focusSection?: 'documents';
  };
  [CustomerStackRoutes.ChatList]: undefined;
  [CustomerStackRoutes.Chat]: undefined;
  [CustomerStackRoutes.CreateChat]: undefined;
  [CustomerStackRoutes.CreateGroup]: undefined;
  [CustomerStackRoutes.GroupInfo]: undefined;
  [CustomerStackRoutes.DealerChat]: undefined;
  [CustomerStackRoutes.AIChat]: undefined;
  [CustomerStackRoutes.SavedAddresses]: { selectMode?: boolean } | undefined;
  [CustomerStackRoutes.Wishlist]: undefined;
  [CustomerStackRoutes.PaymentMethods]: undefined;
  [CustomerStackRoutes.PersonalInformation]: undefined;
  [CustomerStackRoutes.Settings]: undefined;
  [CustomerStackRoutes.BlockedAccounts]: undefined;
  [CustomerStackRoutes.ChangePassword]: undefined;
  [CustomerStackRoutes.CustomerNotificationSettings]: undefined;
  [CustomerStackRoutes.TermsConditions]: undefined;
  [CustomerStackRoutes.AppPermissions]: undefined;
  [CustomerStackRoutes.CustomerHelpSupport]: undefined;
  [CustomerStackRoutes.DeleteAccount]: undefined;
  [CustomerStackRoutes.AddAddressMethod]: undefined;
  [CustomerStackRoutes.AddLiveLocation]: { address?: IAddress; isEdit?: boolean } | undefined;
  [CustomerStackRoutes.ManualAddress]: { address?: IAddress; isEdit?: boolean } | undefined;
  [CustomerStackRoutes.OtpVerification]: { phone?: string } | undefined;
  [CustomerStackRoutes.OtpLoading]: { phone: string; otp: string };
  [CustomerStackRoutes.OtpSuccess]: undefined;
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
        name={CustomerStackRoutes.CreateCommunityPost}
        component={CreateCommunityPostScreen}
      />
      <Stack.Screen
        name={CustomerStackRoutes.AddVehicle}
        component={AddVehicleScreen}
      />
      <Stack.Screen
        name={CustomerStackRoutes.GarageVehicleDetail}
        component={GarageVehicleDetailScreen}
      />
      <Stack.Screen
        name={CustomerStackRoutes.AiAssistant}
        component={AIChatScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name={CustomerStackRoutes.ChatList} component={ChatListScreen} />
      <Stack.Screen name={CustomerStackRoutes.Chat} component={ChatScreen} />
      <Stack.Screen name={CustomerStackRoutes.CreateChat} component={CreateChatScreen} />
      <Stack.Screen name={CustomerStackRoutes.CreateGroup} component={CreateGroupScreen} />
      <Stack.Screen name={CustomerStackRoutes.GroupInfo} component={GroupInfoScreen} />
      <Stack.Screen name={CustomerStackRoutes.DealerChat} component={DealerChatScreen} />
      <Stack.Screen name={CustomerStackRoutes.AIChat} component={AIChatScreen} />
      <Stack.Screen name={CustomerStackRoutes.SavedAddresses} component={SavedAddressesScreen} />
      <Stack.Screen name={CustomerStackRoutes.Wishlist} component={WishlistScreen} />
      <Stack.Screen name={CustomerStackRoutes.PaymentMethods} component={PaymentMethodsScreen} />
      <Stack.Screen
        name={CustomerStackRoutes.PersonalInformation}
        component={PersonalInformationScreen}
      />
      <Stack.Screen name={CustomerStackRoutes.Settings} component={SettingsScreen} />
      <Stack.Screen
        name={CustomerStackRoutes.BlockedAccounts}
        component={BlockedAccountsScreen}
      />
      <Stack.Screen name={CustomerStackRoutes.ChangePassword} component={ChangePasswordScreen} />
      <Stack.Screen
        name={CustomerStackRoutes.CustomerNotificationSettings}
        component={CustomerNotificationSettingsScreen}
      />
      <Stack.Screen name={CustomerStackRoutes.AppPermissions} component={AppPermissionsScreen} />
      <Stack.Screen
        name={CustomerStackRoutes.TermsConditions}
        component={TermsConditionsScreen}
      />
      <Stack.Screen
        name={CustomerStackRoutes.CustomerHelpSupport}
        component={CustomerHelpSupportScreen}
      />
      <Stack.Screen name={CustomerStackRoutes.DeleteAccount} component={DeleteAccountScreen} />
      <Stack.Screen name={CustomerStackRoutes.AddAddressMethod} component={AddAddressMethodScreen} />
      <Stack.Screen name={CustomerStackRoutes.AddLiveLocation} component={AddLiveLocationScreen} />
      <Stack.Screen name={CustomerStackRoutes.ManualAddress} component={ManualAddressScreen} />
      <Stack.Screen
        name={CustomerStackRoutes.OtpVerification}
        component={OtpVerificationScreen}
      />
      <Stack.Screen name={CustomerStackRoutes.OtpLoading} component={OtpLoadingScreen} />
      <Stack.Screen name={CustomerStackRoutes.OtpSuccess} component={OtpSuccessScreen} />
    </Stack.Navigator>
  );
}
