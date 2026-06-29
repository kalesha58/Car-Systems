import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStatusBar, ErrorBoundary } from '@components/common';
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
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <BookingsProvider>
            <DealerProvider>
              <CartProvider>
                <WishlistProvider>
                  <ServiceBookingProvider>
                    <AppStatusBar />
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
