import {View, Text, StyleSheet, Image, Alert} from 'react-native';
import React, {FC, useEffect} from 'react';
import {Colors} from '@utils/Constants';
import Logo from '@assets/images/logo.jpeg';
import {screenHeight, screenWidth} from '@utils/Scaling';
import { resetAndNavigate} from '@utils/NavigationUtils';
import GeoLocation from '@react-native-community/geolocation';
import {useAuthStore} from '@state/authStore';
import { tokenStorage, storage, clearBusinessRegistrationDraft } from '@state/storage';
import {jwtDecode} from 'jwt-decode';
import {refetchUser, refresh_tokens} from '@service/authService';
import {resetNavigationForDealerOnboarding} from '../../auth/postAuthRouting';

GeoLocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'always',
  enableBackgroundLocationUpdates: true,
  locationProvider: 'auto',
});

interface DecodedToken {
  exp: number;
}

const SplashScreen: FC = () => {
  const {user, setUser} = useAuthStore();

  const checkUserRole = (role: string | string[] | undefined): string | null => {
    if (!role) {
      return null;
    }
    
    const roleArray = Array.isArray(role) ? role : [role];
    
    if (roleArray.includes('admin')) {
      return 'admin';
    }
    if (roleArray.includes('dealer')) {
      return 'dealer';
    }
    if (roleArray.includes('user')) {
      return 'user';
    }
    
    return null;
  };

  const performRoleCheckAndNavigate = async () => {
    const currentUser = useAuthStore.getState().user;
    if (currentUser && currentUser.role) {
      const userRole = checkUserRole(currentUser.role);
      await navigateByRole(userRole, currentUser.id);
    }
  };

  const navigateByRole = async (userRole: string | null, userId?: string) => {
    if (userRole === 'user') {
      // Check if user has skipped adding vehicle
      const hasSkippedVehicle = storage.getString('hasSkippedVehicle') === 'true';
      
      if (hasSkippedVehicle) {
        // User has skipped before, navigate directly to MainTabs
        resetAndNavigate('MainTabs');
        return;
      }

      // Check if user has vehicles before navigating
      if (userId) {
        try {
          const userIdString = String(userId);
          const { getUserVehicles } = await import('@service/vehicleService');
          const vehiclesData = await getUserVehicles();
          // Response is directly an array, not an object with vehicles property
          const hasVehicles = vehiclesData?.Response && Array.isArray(vehiclesData.Response) && vehiclesData.Response.length > 0;
          
          if (hasVehicles) {
            // User already has vehicles, clear skip flag and navigate to MainTabs
            storage.delete('hasSkippedVehicle');
            resetAndNavigate('MainTabs');
          } else {
            // User doesn't have vehicles, navigate to AddUserVehicle
            resetAndNavigate('AddUserVehicle');
          }
        } catch (error: any) {
          // If check fails, check skip flag before navigating
          console.error('Error checking user vehicles in SplashScreen:', error);
          const hasSkippedVehicle = storage.getString('hasSkippedVehicle') === 'true';
          if (hasSkippedVehicle) {
            resetAndNavigate('MainTabs');
          } else {
            resetAndNavigate('AddUserVehicle');
          }
        }
      } else {
        // No userId, navigate to AddUserVehicle
        resetAndNavigate('AddUserVehicle');
      }
    } else if (userRole === 'dealer') {
      await resetNavigationForDealerOnboarding();
    } else if (userRole === 'admin') {
      resetAndNavigate('MainTabs');
    } else {
      resetAndNavigate('CustomerLogin');
    }
  };

  const tokenCheck = async () => {
    try {
      const accessToken = tokenStorage.getString('accessToken') as string;
      const refreshToken = tokenStorage.getString('refreshToken') as string;

      if (!accessToken || !refreshToken) {
        resetAndNavigate('CustomerLogin');
        return;
      }

      try {
        const decodedAccessToken = jwtDecode<DecodedToken>(accessToken);
        const decodedRefreshToken = jwtDecode<DecodedToken>(refreshToken);
        const currentTime = Date.now() / 1000;

        if (decodedRefreshToken?.exp < currentTime) {
          tokenStorage.clearAll();
          const currentUser = useAuthStore.getState().user;
          clearBusinessRegistrationDraft(currentUser?.id);
          const { logout } = useAuthStore.getState();
          logout();
          resetAndNavigate('CustomerLogin');
          Alert.alert('Session Expired', 'Please login again');
          return;
        }

        let currentUser = useAuthStore.getState().user;

        if (decodedAccessToken?.exp < currentTime) {
          try {
            await refresh_tokens();
            await refetchUser(setUser);
            currentUser = useAuthStore.getState().user;
          } catch (error) {
            tokenStorage.clearAll();
            const currentUserBeforeLogout = useAuthStore.getState().user;
            clearBusinessRegistrationDraft(currentUserBeforeLogout?.id);
            const { logout } = useAuthStore.getState();
            logout();
            resetAndNavigate('CustomerLogin');
            return;
          }
        }

        if (!currentUser) {
          try {
            await refetchUser(setUser);
            currentUser = useAuthStore.getState().user;
          } catch (error) {
            tokenStorage.clearAll();
            const currentUserBeforeLogout = useAuthStore.getState().user;
            clearBusinessRegistrationDraft(currentUserBeforeLogout?.id);
            const { logout } = useAuthStore.getState();
            logout();
            resetAndNavigate('CustomerLogin');
            return;
          }
        }

        if (currentUser) {
          const userRole = checkUserRole(currentUser.role);
          await navigateByRole(userRole, currentUser.id);
        } else {
          resetAndNavigate('CustomerLogin');
        }
      } catch (decodeError) {
        tokenStorage.clearAll();
        const currentUser = useAuthStore.getState().user;
        clearBusinessRegistrationDraft(currentUser?.id);
        const { logout } = useAuthStore.getState();
        logout();
        resetAndNavigate('CustomerLogin');
      }
    } catch (error) {
      tokenStorage.clearAll();
      const currentUser = useAuthStore.getState().user;
      clearBusinessRegistrationDraft(currentUser?.id);
      const { logout } = useAuthStore.getState();
      logout();
      resetAndNavigate('CustomerLogin');
    }
  };

  useEffect(() => {
    const intialStartup = async () => {
      try {
        await GeoLocation.requestAuthorization();
      } catch (error) {
        // Location permission error - continue anyway
      }
      
      // Wait a bit for navigation to be ready, then check token
      setTimeout(() => {
        tokenCheck();
      }, 1500);
    };

    intialStartup();

    // Fallback: ensure navigation happens even if tokenCheck fails
    const fallbackTimeout = setTimeout(() => {
      const accessToken = tokenStorage.getString('accessToken') as string;
      if (!accessToken) {
        resetAndNavigate('CustomerLogin');
      }
    }, 3000);

    return () => {
      clearTimeout(fallbackTimeout);
    };
  }, []);

  useEffect(() => {
    if (user && user.role) {
      const userRole = checkUserRole(user.role);
      if (userRole) {
        navigateByRole(userRole, user.id);
      }
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <Image source={Logo} style={styles.logoImage} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    height: screenHeight * 0.4,
    width: screenWidth * 0.4,
    resizeMode: 'contain',
  },
});

export default SplashScreen;
