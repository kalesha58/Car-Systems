import React, {FC} from 'react';
import {View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import {navigationRef} from '@utils/NavigationUtils';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import SplashScreen from '@features/auth/SplashScreen';
import DeliveryLogin from '@features/auth/DeliveryLogin';
import CustomerLogin from '@features/auth/CustomerLogin';
import ProductDashboard from '@features/dashboard/ProductDashboard';
import DealerDashboard from '@features/dashboard/DealerDashboard';
import PlayScreen from '@features/play/PlayScreen';
import ProductCategories from '@features/category/ProductCategories';
import CartScreen from '@features/cart/CartScreen';
import Profile from '@features/profile/Profile';
import SavedAddresses from '@features/address/SavedAddresses';
import AddNewAddress from '@features/address/AddNewAddress';
import AddressForm from '@features/address/AddressForm';
import OrderSuccess from '@features/order/OrderSuccess';
import ProductDetail from '@features/product/ProductDetail';
import CreateNewPost from '@features/play/CreateNewPost';
import LiveTracking from '@features/map/LiveTracking';
import OrdersList from '@features/order/OrdersList';
import DealerOrdersList from '@features/order/DealerOrdersList';
import InventoryScreen from '@features/inventory/InventoryScreen';
import {useCartStore} from '@state/cartStore';
import {useTheme} from '@hooks/useTheme';
import {ToastProvider} from '@context/ToastContext';
import {useTranslation} from 'react-i18next';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs: FC = () => {
  const {cart} = useCartStore();
  const {colors} = useTheme();
  const cartCount = cart.reduce((sum, item) => sum + item.count, 0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.disabled,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: RFValue(10),
          fontFamily: Fonts.Medium,
        },
      }}>
      <Tab.Screen
        name="Home"
        component={ProductDashboard}
        options={{
          tabBarIcon: ({color, size}) => (
            <Icon name="home-outline" size={size} color={color} />
          ),
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Play"
        component={PlayScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <Icon name="play-circle-outline" size={size} color={color} />
          ),
          tabBarLabel: 'Play',
        }}
      />
      <Tab.Screen
        name="Category"
        component={ProductCategories}
        options={{
          tabBarIcon: ({color, size}) => (
            <Icon name="grid-outline" size={size} color={color} />
          ),
          tabBarLabel: 'Categories',
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({color, size}) => (
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
                    style={{color: '#fff'}}>
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
  const {colors} = useTheme();
  const {t} = useTranslation('dealer');

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.disabled,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: RFValue(10),
          fontFamily: Fonts.Medium,
        },
      }}>
      <Tab.Screen
        name="Home"
        component={DealerDashboard}
        options={{
          tabBarIcon: ({color, size}) => (
            <Icon name="home-outline" size={size} color={color} />
          ),
          tabBarLabel: t('dashboard'),
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <Icon name="cube-outline" size={size} color={color} />
          ),
          tabBarLabel: t('inventory'),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={DealerOrdersList}
        options={{
          tabBarIcon: ({color, size}) => (
            <Icon name="receipt-outline" size={size} color={color} />
          ),
          tabBarLabel: t('orders'),
        }}
      />
    </Tab.Navigator>
  );
};

const Navigation: FC = () => {
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
          <Stack.Screen name="InventoryScreen" component={InventoryScreen} />
          <Stack.Screen name="DealerOrdersList" component={DealerOrdersList} />
          <Stack.Screen name="Profile" component={Profile} />
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
              headerShown: false,
            }}
            name="LiveTracking"
            component={LiveTracking}
          />
          <Stack.Screen
            options={{
              headerShown: false,
            }}
            name="OrdersList"
            component={OrdersList}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ToastProvider>
  );
};

export default Navigation;
