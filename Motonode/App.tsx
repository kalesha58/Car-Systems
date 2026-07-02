import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStatusBar, ErrorBoundary } from '@components/common';
import { PushNotificationHandler } from '@components/notifications/PushNotificationHandler';
import {
  AuthProvider,
  BookingsProvider,
  CartProvider,
  DealerProvider,
  MobileVerificationProvider,
  ServiceBookingProvider,
  WishlistProvider,
  ToastProvider,
  ChatProvider,
} from '@context/index';
import { linking, navigationRef, RootNavigator } from '@navigation/index';

function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <MobileVerificationProvider>
              <ChatProvider>
                <BookingsProvider>
                  <DealerProvider>
                    <CartProvider>
                      <WishlistProvider>
                        <ServiceBookingProvider>
                          <AppStatusBar />
                          <NavigationContainer ref={navigationRef} linking={linking}>
                            <RootNavigator />
                            <PushNotificationHandler />
                          </NavigationContainer>
                        </ServiceBookingProvider>
                      </WishlistProvider>
                    </CartProvider>
                  </DealerProvider>
                </BookingsProvider>
              </ChatProvider>
            </MobileVerificationProvider>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default App;
