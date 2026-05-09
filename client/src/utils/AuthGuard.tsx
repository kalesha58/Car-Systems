import { Alert } from 'react-native';
import { useAuthStore } from '@state/authStore';
import { navigate } from './NavigationUtils';

/**
 * A utility to protect actions that require authentication.
 * If the user is logged in, it executes the callback.
 * If the user is a guest, it shows an alert prompting them to login.
 * 
 * @param callback The function to execute if the user is authenticated.
 * @param message Custom message to show in the alert.
 */
export const withAuth = (callback: () => void, message?: string) => {
  const user = useAuthStore.getState().user;

  if (user && !user.isGuest) {
    // User is authenticated, proceed with action
    callback();
  } else {
    // User is a guest, show login prompt
    Alert.alert(
      'Login Required',
      message || 'Please login to perform this action and access all features of Motonode.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Login / Signup',
          onPress: () => navigate('CustomerLogin'),
        },
      ],
      { cancelable: true }
    );
  }
};

/**
 * Hook version of the auth guard for use in components if needed.
 */
export const useAuthGuard = () => {
  const user = useAuthStore((state) => state.user);
  const isGuest = !user || user.isGuest;
  
  const checkAuth = (callback: () => void, message?: string) => {
    if (!isGuest) {
      callback();
    } else {
      Alert.alert(
        'Login Required',
        message || 'Please login to perform this action.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigate('CustomerLogin') }
        ]
      );
    }
  };

  return { isGuest, checkAuth };
};
