import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Loading } from '@components/loaders/Loading';
import { useAuth } from '@context/AuthContext';
import { RootRoutes } from '@constants/routes';
import { AuthNavigator } from './AuthNavigator';
import { CustomerNavigator } from './CustomerNavigator';
import { DealerNavigator } from './DealerNavigator';

export type RootStackParamList = {
  [RootRoutes.Auth]: undefined;
  [RootRoutes.Customer]: undefined;
  [RootRoutes.Dealer]: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, isLoading, isOnboarded } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  const showAuth = !isOnboarded || !user;
  const showCustomer = isOnboarded && user?.role === 'customer';
  const showDealer = isOnboarded && user?.role === 'dealer';

  const initialRoute = showAuth
    ? RootRoutes.Auth
    : showDealer
      ? RootRoutes.Dealer
      : RootRoutes.Customer;

  return (
    <Stack.Navigator
      key={`${initialRoute}-${user?.id ?? 'guest'}`}
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}>
      {showAuth ? <Stack.Screen name={RootRoutes.Auth} component={AuthNavigator} /> : null}
      {showCustomer ? (
        <Stack.Screen name={RootRoutes.Customer} component={CustomerNavigator} />
      ) : null}
      {showDealer ? <Stack.Screen name={RootRoutes.Dealer} component={DealerNavigator} /> : null}
    </Stack.Navigator>
  );
}
