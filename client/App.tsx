import React, { useEffect } from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import { AppState, AppStateStatus, Appearance } from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import './src/config/i18n';
import Navigation from '@navigation/Navigation';
import { initializeNotifications, getFCMToken, registerFCMToken } from '@service/notificationService';
import { tokenStorage } from '@state/storage';
import { useThemeStore } from '@state/themeStore';

const App = () => {
  const { initializeTheme, syncWithDeviceTheme } = useThemeStore();

  useEffect(() => {
    // Initialize theme based on device theme on first load
    initializeTheme();
    
    // Sync with device theme after a brief delay to ensure state is hydrated
    setTimeout(() => {
      syncWithDeviceTheme();
    }, 100);

    // Listen for device theme changes and auto-sync
    const appearanceSubscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Sync with device theme when it changes
      syncWithDeviceTheme();
    });

    // Initialize notifications on app start
    initializeNotifications();

    // Handle app state changes for token refresh
    const appStateSubscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
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
      appearanceSubscription.remove();
      appStateSubscription.remove();
    };
  }, [initializeTheme, syncWithDeviceTheme]);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
    <SafeAreaProvider>
      <Navigation />
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;