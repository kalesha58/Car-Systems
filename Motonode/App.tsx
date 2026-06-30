import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStatusBar, ErrorBoundary } from '@components/common';
import { ChatNotificationHandler } from '@components/chat/ChatNotificationHandler';
import {
  AuthProvider,
  BookingsProvider,
  CartProvider,
  DealerProvider,
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
            <ChatProvider>
              <BookingsProvider>
                <DealerProvider>
                  <CartProvider>
                    <WishlistProvider>
                      <ServiceBookingProvider>
                        <AppStatusBar />
                        <NavigationContainer ref={navigationRef} linking={linking}>
                          <RootNavigator />
                          <ChatNotificationHandler />
                        </NavigationContainer>
                      </ServiceBookingProvider>
                    </WishlistProvider>
                  </CartProvider>
                </DealerProvider>
              </BookingsProvider>
            </ChatProvider>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default App;
