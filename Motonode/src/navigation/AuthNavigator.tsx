import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthRoutes } from '@constants/routes';
import { useAuth } from '@context/AuthContext';
import { LoginScreen, OtpVerifyScreen, OnboardingScreen, SignupScreen } from '@screens/auth';

export type AuthStackParamList = {
  [AuthRoutes.Onboarding]: undefined;
  [AuthRoutes.Login]: { prefillEmail?: string } | undefined;
  [AuthRoutes.Signup]: undefined;
  [AuthRoutes.OtpVerify]: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const { isOnboarded } = useAuth();
  const initialRoute = isOnboarded ? AuthRoutes.Login : AuthRoutes.Onboarding;

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name={AuthRoutes.Onboarding} component={OnboardingScreen} />
      <Stack.Screen name={AuthRoutes.Login} component={LoginScreen} />
      <Stack.Screen name={AuthRoutes.Signup} component={SignupScreen} />
      <Stack.Screen name={AuthRoutes.OtpVerify} component={OtpVerifyScreen} />
    </Stack.Navigator>
  );
}
