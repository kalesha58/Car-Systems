import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@components/common/ErrorBoundary';
import {
  AuthProvider,
  CartProvider,
  DealerProvider,
  WishlistProvider,
} from '@context/index';
import { linking, RootNavigator } from '@navigation/index';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <DealerProvider>
            <CartProvider>
              <WishlistProvider>
                <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
                <NavigationContainer linking={linking}>
                  <RootNavigator />
                </NavigationContainer>
              </WishlistProvider>
            </CartProvider>
          </DealerProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default App;
