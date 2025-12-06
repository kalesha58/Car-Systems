import React, {FC} from 'react';
import {View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import {navigationRef} from '@utils/NavigationUtils';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import SplashScreen from '@features/auth/SplashScreen';
import DeliveryLogin from '@features/auth/DeliveryLogin';
import CustomerLogin from '@features/auth/CustomerLogin';
import ProductDashboard from '@features/dashboard/ProductDashboard';
import PlayScreen from '@features/play/PlayScreen';
import ProductCategories from '@features/category/ProductCategories';
import CartScreen from '@features/cart/CartScreen';
import Profile from '@features/profile/Profile';
import SavedAddresses from '@features/address/SavedAddresses';
import AddNewAddress from '@features/address/AddNewAddress';
import AddressForm from '@features/address/AddressForm';
import OrderSuccess from '@features/order/OrderSuccess';
import {useCartStore} from '@state/cartStore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs: FC = () => {
  const {cart} = useCartStore();
  const cartCount = cart.reduce((sum, item) => sum + item.count, 0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.secondary,
        tabBarInactiveTintColor: Colors.disabled,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: Colors.border,
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

const Navigation: FC = () => {
  return (
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
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="SavedAddresses" component={SavedAddresses} />
        <Stack.Screen name="AddNewAddress" component={AddNewAddress} />
        <Stack.Screen name="AddressForm" component={AddressForm} />
        <Stack.Screen name="OrderSuccess" component={OrderSuccess} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
