import React, { FC, useEffect, useState } from 'react';
import { View, AppState, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef, resetAndNavigate } from '@utils/NavigationUtils';
import { useAuthStore } from '@state/authStore';
import Icon from 'react-native-vector-icons/Ionicons';
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import SplashScreen from '@features/auth/SplashScreen';
import DeliveryLogin from '@features/auth/DeliveryLogin';
import CustomerLogin from '@features/auth/CustomerLogin';
import ProductDashboard from '@features/dashboard/ProductDashboard';
import DealerDashboard from '@features/dashboard/DealerDashboard';
import PlayScreen from '@features/play/PlayScreen';
import ProductCategories from '@features/category/ProductCategories';
import CompareScreen from '@features/category/CompareScreen';
import CartScreen from '@features/cart/CartScreen';
import Profile from '@features/profile/Profile';
import EditProfile from '@features/profile/EditProfile';
import BusinessRegistrationScreen from '@features/profile/BusinessRegistrationScreen';
import SavedAddresses from '@features/address/SavedAddresses';
import AddNewAddress from '@features/address/AddNewAddress';
import AddressForm from '@features/address/AddressForm';
import OrderSuccess from '@features/order/OrderSuccess';
import ProductDetail from '@features/product/ProductDetail';
import CreateNewPost from '@features/play/CreateNewPost';
import LiveTracking from '@features/map/LiveTracking';
import OrdersList from '@features/order/OrdersList';
import DealerOrdersList from '@features/order/DealerOrdersList';
import DeliveryMap from '@features/delivery/DeliveryMap';
import InventoryScreen from '@features/inventory/InventoryScreen';
import AddEditProductScreen from '@features/inventory/AddEditProductScreen';
import AddEditVehicleScreen from '@features/inventory/AddEditVehicleScreen';
import AddEditServiceScreen from '@features/inventory/AddEditServiceScreen';
import ChatScreen from '@features/chat/ChatScreen';
import UserSelectionScreen from '@features/chat/UserSelectionScreen';
import ChatMessageScreen from '@features/chat/ChatMessageScreen';
import CreateGroupScreen from '@features/chat/CreateGroupScreen';
import EditGroupScreen from '@features/chat/EditGroupScreen';
import JoinRequestsScreen from '@features/chat/JoinRequestsScreen';
import LocationPickerScreen from '@features/chat/LocationPickerScreen';
import PaymentStatusScreen from '@features/payment/PaymentStatusScreen';
import ProductOrder from '@features/order/ProductOrder';
import VehicleDetail from '@features/vehicle/VehicleDetail';
import ServiceDetail from '@features/service/ServiceDetail';
import { useCartStore } from '@state/cartStore';
import { useTheme } from '@hooks/useTheme';
import { ToastProvider } from '@context/ToastContext';
import { useTranslation } from 'react-i18next';
import LiquidTabBar from '@components/navigation/LiquidTabBar';
import ForgotPassword from '@features/auth/ForgotPassword';
import MetAIChatScreen from '@features/support/MetAIChatScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs: FC = () => {
  const { cart } = useCartStore();
  const { colors } = useTheme();
  const cartCount = cart.reduce((sum, item) => sum + item.count, 0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.disabled,
      }}
      tabBar={(props) => <LiquidTabBar {...props} />}>
      <Tab.Screen
        name="Home"
        component={ProductDashboard}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home-outline" size={size} color={color} />
          ),
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Play"
        component={PlayScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="play-circle-outline" size={size} color={color} />
          ),
          tabBarLabel: 'Play',
        }}
      />
      <Tab.Screen
        name="Category"
        component={ProductCategories}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="grid-outline" size={size} color={color} />
          ),
          tabBarLabel: 'Categories',
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View>
              <Icon name="bag-outline" size={size} color={color} />
              {cartCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    right: -8,
                    top: -4,
                    backgroundColor: '#ff3040',
                    borderRadius: 8,
                    width: 16,
                    height: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <CustomText
                    fontSize={RFValue(8)}
                    fontFamily={Fonts.Bold}
                    style={{ color: '#fff' }}>
                    {cartCount > 9 ? '9+' : cartCount}
                  </CustomText>
                </View>
              )}
            </View>
          ),
          tabBarLabel: 'Cart',
        }}
      />
    </Tab.Navigator>
  );
};

const DealerTabs: FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [businessRegistration, setBusinessRegistration] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkBusinessRegistration = async () => {
      const userId = user?.id || user?._id;
      if (!userId) {
        setIsChecking(false);
        return;
      }

      try {
        const { getBusinessRegistrationByUserId } = await import('@service/dealerService');
        const registration = await getBusinessRegistrationByUserId(userId);
        setBusinessRegistration(registration);

        // Only redirect if no registration exists OR status is rejected
        // Allow access if registration exists (even if pending or approved)
        if (!registration || (registration && registration.status === 'rejected')) {
          resetAndNavigate('BusinessRegistration');
        }
      } catch (error) {
        console.error('Error checking business registration:', error);
        // On error, check if it's a 404 (no registration) - redirect to registration
        // Otherwise allow access (might be network error)
        const errorStatus = (error as any)?.response?.status;
        if (errorStatus === 404) {
          resetAndNavigate('BusinessRegistration');
        } else {
          // Network error or other - allow access, will be handled by dashboard
          setIsChecking(false);
        }
        return;
      } finally {
        setIsChecking(false);
      }
    };

    checkBusinessRegistration();
  }, [user?.id, user?._id]);

  // Show loading while checking registration
  // Only block if checking OR if registration doesn't exist or is rejected
  const shouldBlock = isChecking || !businessRegistration || (businessRegistration && businessRegistration.status === 'rejected');
  if (shouldBlock) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.disabled,
      }}
      tabBar={(props) => <LiquidTabBar {...props} />}>
      <Tab.Screen
        name="Home"
        component={DealerDashboard}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="speedometer-outline" size={size} color={color} />
          ),
          tabBarLabel: t('dealer.dashboard'),
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="cube-outline" size={size} color={color} />
          ),
          tabBarLabel: t('dealer.inventory'),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={DealerOrdersList}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="receipt-outline" size={size} color={color} />
          ),
          tabBarLabel: t('dealer.orders'),
        }}
      />
    </Tab.Navigator>
  );
};

const Navigation: FC = () => {
  const { user } = useAuthStore();

  const checkUserRole = (role: string | string[] | undefined): string | null => {
    if (!role) {
      return null;
    }

    const roleArray = Array.isArray(role) ? role : [role];

    if (roleArray.includes('admin')) {
      return 'admin';
    }
    if (roleArray.includes('dealer')) {
      return 'dealer';
    }
    if (roleArray.includes('user')) {
      return 'user';
    }

    return null;
  };

  const navigateByRole = (userRole: string | null) => {
    if (userRole === 'user') {
      resetAndNavigate('MainTabs');
    } else if (userRole === 'dealer') {
      resetAndNavigate('DealerTabs');
    } else if (userRole === 'admin') {
      resetAndNavigate('MainTabs');
    }
  };

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && user && user.role) {
        const userRole = checkUserRole(user.role);
        if (userRole && navigationRef.isReady()) {
          const currentRoute = navigationRef.getCurrentRoute();
          if (currentRoute) {
            const currentRouteName = currentRoute.name;
            // Exclude dealer-related screens from auto-navigation
            const dealerScreens = [
              'DealerTabs',
              'DealerDashboard',
              'InventoryScreen',
              'DealerOrdersList',
              'AddEditProduct',
              'AddEditVehicle',
              'AddEditService',
              'BusinessRegistration',
              'BusinessRegistrationDetails',
            ];
            const isDealerScreen = dealerScreens.includes(currentRouteName) || currentRouteName.includes('Dealer');

            if (userRole === 'dealer' && !isDealerScreen) {
              navigateByRole(userRole);
            } else if (userRole === 'user' && currentRouteName === 'DealerTabs') {
              navigateByRole(userRole);
            }
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [user]);

  return (
    <ToastProvider>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          // Navigation is ready
        }}>
        <Stack.Navigator
          initialRouteName="SplashScreen"
          screenOptions={{
            headerShown: false,
          }}>
          <Stack.Screen name="SplashScreen" component={SplashScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="DealerTabs" component={DealerTabs} />
          <Stack.Screen name="DealerDashboard" component={DealerDashboard} />
          <Stack.Screen name="Analytics" component={require('@features/dashboard/AnalyticsScreen').default} />
          <Stack.Screen name="InventoryScreen" component={InventoryScreen} />
          <Stack.Screen
            name="AddEditProduct"
            component={AddEditProductScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="AddEditVehicle"
            component={AddEditVehicleScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="AddEditService"
            component={AddEditServiceScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen name="DealerOrdersList" component={DealerOrdersList} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen
            name="EditProfile"
            component={EditProfile}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="BusinessRegistration"
            component={BusinessRegistrationScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="BusinessRegistrationDetails"
            getComponent={() => require('@features/profile/BusinessRegistrationDetailsScreen').default}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="MetAIChat"
            component={MetAIChatScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen name="SavedAddresses" component={SavedAddresses} />
          <Stack.Screen name="AddNewAddress" component={AddNewAddress} />
          <Stack.Screen name="AddressForm" component={AddressForm} />
          <Stack.Screen name="OrderSuccess" component={OrderSuccess} />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetail}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="VehicleDetail"
            component={VehicleDetail}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="ServiceDetail"
            component={ServiceDetail}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="CreateNewPost"
            component={CreateNewPost}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            options={{
              animation: 'fade',
            }}
            name="DeliveryLogin"
            component={DeliveryLogin}
          />
          <Stack.Screen
            options={{
              animation: 'fade',
            }}
            name="CustomerLogin"
            component={CustomerLogin}
          />
          <Stack.Screen
            options={{
              animation: 'slide_from_right',
            }}
            name="ForgotPassword"
            component={ForgotPassword}
          />
          <Stack.Screen
            options={{
              headerShown: false,
            }}
            name="LiveTracking"
            component={LiveTracking}
          />
          <Stack.Screen
            options={{
              headerShown: false,
            }}
            name="DeliveryMap"
            component={DeliveryMap}
          />
          <Stack.Screen
            options={{
              headerShown: false,
            }}
            name="OrdersList"
            component={OrdersList}
          />
          <Stack.Screen
            options={{
              headerShown: false,
            }}
            name="Chat"
            component={ChatScreen}
          />
          <Stack.Screen
            options={{
              headerShown: false,
            }}
            name="UserSelection"
            component={UserSelectionScreen}
          />
          <Stack.Screen
            options={{
              headerShown: false,
            }}
            name="ChatMessage"
            component={ChatMessageScreen}
          />
          <Stack.Screen
            options={{
              headerShown: false,
            }}
            name="CreateGroup"
            component={CreateGroupScreen}
          />
          <Stack.Screen
            options={{
              headerShown: false,
            }}
            name="EditGroup"
            component={EditGroupScreen}
          />
          <Stack.Screen
            options={{
              headerShown: false,
            }}
            name="JoinRequests"
            component={JoinRequestsScreen}
          />
          <Stack.Screen
            options={{
              headerShown: false,
            }}
            name="LocationPicker"
            component={LocationPickerScreen}
          />
          <Stack.Screen
            options={{
              headerShown: false,
            }}
            name="PaymentStatus"
            component={PaymentStatusScreen}
          />
          <Stack.Screen
            options={{
              animation: 'slide_from_right',
            }}
            name="CompareScreen"
            component={CompareScreen}
          />
          <Stack.Screen
            options={{
              animation: 'slide_from_right',
            }}
            name="ProductOrder"
            component={ProductOrder}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ToastProvider>
  );
};

export default Navigation;
