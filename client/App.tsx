import React, { useEffect } from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import { AppState, AppStateStatus, Appearance } from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import './src/config/i18n';
import Navigation from '@navigation/Navigation';
import { initializeNotifications } from '@service/notificationService';
import { tokenStorage } from '@state/storage';
import { useThemeStore } from '@state/themeStore';
import { useAuthStore } from '@state/authStore';
import { initializeSocket, joinUserNotificationRoom, onNewNotification } from '@service/socketService';

const App = () => {
  const { initializeTheme, syncWithDeviceTheme } = useThemeStore();
  const { user } = useAuthStore();

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

    // Initialize socket and join notification room if user is authenticated
    const accessToken = tokenStorage.getString('accessToken');
    if (accessToken && user?.userId) {
      try {
        const socket = initializeSocket();
        if (socket) {
          socket.on('connect', () => {
            joinUserNotificationRoom(user.userId);
          });
          
          // Listen for new notifications
          onNewNotification((notification) => {
            console.log('New notification received:', notification);
            // Notification icon will auto-refresh via its own polling
          });
        }
      } catch (error) {
        console.error('Error initializing socket:', error);
      }
    }

    // Handle app state changes - rejoin notification room when app becomes active
    const appStateSubscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const accessToken = tokenStorage.getString('accessToken');
        if (accessToken && user?.userId) {
          try {
            const socket = initializeSocket();
            if (socket?.connected) {
              joinUserNotificationRoom(user.userId);
            }
          } catch (error) {
            console.error('Error rejoining notification room:', error);
          }
        }
      }
    });

    return () => {
      appearanceSubscription.remove();
      appStateSubscription.remove();
    };
  }, [initializeTheme, syncWithDeviceTheme, user?.userId]);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
    <SafeAreaProvider>
      <Navigation />
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;