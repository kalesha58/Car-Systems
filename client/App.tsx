import React, { useEffect } from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import { AppState, AppStateStatus } from 'react-native';
import './src/config/i18n';
import Navigation from '@navigation/Navigation';
import { initializeNotifications, getFCMToken, registerFCMToken } from '@service/notificationService';
import { tokenStorage } from '@state/storage';

const App = () => {
  useEffect(() => {
    // Initialize notifications on app start
    initializeNotifications();

    // Handle app state changes for token refresh
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Only register FCM token if user is authenticated
        const accessToken = tokenStorage.getString('accessToken');
        if (accessToken) {
          const token = await getFCMToken();
          if (token) {
            await registerFCMToken(token);
          }
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