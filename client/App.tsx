import React, { useEffect } from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import { AppState, AppStateStatus } from 'react-native';
import './src/config/i18n';
import Navigation from '@navigation/Navigation';
import { initializeNotifications, getFCMToken, registerFCMToken } from '@service/notificationService';

const App = () => {
  useEffect(() => {
    // Initialize notifications on app start
    initializeNotifications();

    // Handle app state changes for token refresh
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Refresh token when app comes to foreground
        const token = await getFCMToken();
        if (token) {
          await registerFCMToken(token);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <Navigation />
    </SafeAreaProvider>
  );
};

export default App;