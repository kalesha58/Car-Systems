import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@components/common/ErrorBoundary';
import {
  AuthProvider,
  BookingsProvider,
  CartProvider,
  DealerProvider,
  ServiceBookingProvider,
  WishlistProvider,
} from '@context/index';
import { linking, RootNavigator } from '@navigation/index';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <BookingsProvider>
            <DealerProvider>
              <CartProvider>
                <WishlistProvider>
                  <ServiceBookingProvider>
                    <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
                    <NavigationContainer linking={linking}>
                      <RootNavigator />
                    </NavigationContainer>
                  </ServiceBookingProvider>
                </WishlistProvider>
              </CartProvider>
            </DealerProvider>
          </BookingsProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default App;
