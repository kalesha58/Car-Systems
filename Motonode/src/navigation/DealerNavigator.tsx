import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { getDealerOnboardingDestination } from '../auth/dealerOnboarding';
import { DealerStackRoutes, CustomerStackRoutes } from '@constants/routes';
import { useDealer } from '@context/index';
import type { DealerOnboardingDestination } from '../types/api';
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
import { DealerOrderDetailScreen } from '@screens/dealer/orders/DealerOrderDetailScreen';
import { StoreSettingsScreen } from '@screens/dealer/settings/StoreSettingsScreen';
import { UPIAccountsScreen } from '@screens/dealer/settings/UPIAccountsScreen';
import { BusinessDetailsScreen } from '@screens/dealer/profile/BusinessDetailsScreen';
import {
  ChatListScreen,
  ChatScreen,
  CreateChatScreen,
  CreateGroupScreen,
  GroupInfoScreen,
  DealerChatScreen,
  AIChatScreen,
} from '@screens/shared/chat';
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
  [DealerStackRoutes.DealerBookingDetail]: {
    bookingId: string;
    bookingType?: 'service' | 'test_drive';
  };
  [DealerStackRoutes.DealerOrderDetail]: { orderId: string };
  [DealerStackRoutes.BusinessDetails]: undefined;
  [CustomerStackRoutes.ChatList]: undefined;
  [CustomerStackRoutes.Chat]: undefined;
  [CustomerStackRoutes.CreateChat]: undefined;
  [CustomerStackRoutes.CreateGroup]: undefined;
  [CustomerStackRoutes.GroupInfo]: undefined;
  [CustomerStackRoutes.DealerChat]: undefined;
  [CustomerStackRoutes.AIChat]: undefined;
};

const Stack = createNativeStackNavigator<DealerStackParamList>();

function mapDestinationToRoute(destination: DealerOnboardingDestination) {
  switch (destination) {
    case 'DealerTabs':
      return DealerStackRoutes.DealerTabs;
    case 'BusinessRegistration':
      return DealerStackRoutes.BusinessRegistration;
    case 'DealerType':
    default:
      return DealerStackRoutes.DealerType;
  }
}

export function DealerNavigator() {
  const { hydrateDealerTypeFromServer } = useDealer();
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function resolveInitialRoute() {
      // Sync inventory capabilities from server registration before tabs mount
      await hydrateDealerTypeFromServer();
      const destination = await getDealerOnboardingDestination();
      if (mounted) {
        setInitialRoute(mapDestinationToRoute(destination));
      }
    }

    void resolveInitialRoute();

    return () => {
      mounted = false;
    };
  }, [hydrateDealerTypeFromServer]);

  if (!initialRoute) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute as keyof DealerStackParamList} screenOptions={{ headerShown: false }}>
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
      <Stack.Screen name={DealerStackRoutes.DealerOrderDetail} component={DealerOrderDetailScreen} />
      <Stack.Screen name={DealerStackRoutes.BusinessDetails} component={BusinessDetailsScreen} />
      <Stack.Screen name={CustomerStackRoutes.ChatList} component={ChatListScreen} />
      <Stack.Screen name={CustomerStackRoutes.Chat} component={ChatScreen} />
      <Stack.Screen name={CustomerStackRoutes.CreateChat} component={CreateChatScreen} />
      <Stack.Screen name={CustomerStackRoutes.CreateGroup} component={CreateGroupScreen} />
      <Stack.Screen name={CustomerStackRoutes.GroupInfo} component={GroupInfoScreen} />
      <Stack.Screen name={CustomerStackRoutes.DealerChat} component={DealerChatScreen} />
      <Stack.Screen name={CustomerStackRoutes.AIChat} component={AIChatScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
