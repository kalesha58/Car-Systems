import { NavigationContainer } from '@react-navigation/native';
import { Platform, StyleSheet, View } from 'react-native';
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
import { ThemeProvider } from './src/context/ThemeContext';
import { linking, navigationRef, RootNavigator } from '@navigation/index';

function AppShell({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return <View style={styles.webShell}>{children}</View>;
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
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
                            <AppShell>
                              <NavigationContainer ref={navigationRef} linking={linking}>
                                <RootNavigator />
                                <PushNotificationHandler />
                              </NavigationContainer>
                            </AppShell>
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
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  webShell: {
    flex: 1,
    width: '100%',
    minHeight: '100%' as unknown as number,
  },
});

export default App;
