import {View, Text, StyleSheet, Image, Alert} from 'react-native';
import React, {FC, useEffect} from 'react';
import {Colors} from '@utils/Constants';
import Logo from '@assets/images/logo.jpeg';
import {screenHeight, screenWidth} from '@utils/Scaling';
import { resetAndNavigate} from '@utils/NavigationUtils';
import GeoLocation from '@react-native-community/geolocation';
import {useAuthStore} from '@state/authStore';
import {tokenStorage} from '@state/storage';
import {jwtDecode} from 'jwt-decode';
import {refetchUser, refresh_tokens} from '@service/authService';
import {getBusinessRegistrationByUserId} from '@service/dealerService';

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
      resetAndNavigate('MainTabs');
    } else if (userRole === 'dealer') {
      // Check if dealer has business registration
      if (userId) {
        try {
          console.log('SplashScreen: Checking business registration for dealer userId:', userId);
          // Ensure userId is a string
          const userIdString = String(userId);
          const businessRegistration = await getBusinessRegistrationByUserId(userIdString);
          console.log('SplashScreen: Business registration check result:', { 
            hasRegistration: !!businessRegistration, 
            status: businessRegistration?.status,
            registration: businessRegistration
          });
          
          // Check if dealer has business registration
          // Navigate to BusinessRegistration if: no registration exists OR status is rejected
          // Navigate to DealerTabs if: registration exists AND (status is pending OR approved)
          if (!businessRegistration) {
            // No registration exists - navigate to business registration screen
            console.log('SplashScreen: ❌ No business registration found - Navigating to BusinessRegistration');
            resetAndNavigate('BusinessRegistration');
          } else if (businessRegistration.status === 'rejected') {
            // Registration was rejected - navigate to business registration screen to resubmit
            console.log('SplashScreen: ❌ Business registration rejected - Navigating to BusinessRegistration');
            resetAndNavigate('BusinessRegistration');
          } else if (businessRegistration.status === 'pending' || businessRegistration.status === 'approved') {
            // Has registration with status pending or approved - navigate to dealer dashboard
            console.log('SplashScreen: ✅ Business registration found with status:', businessRegistration.status, '- Navigating to DealerTabs');
            resetAndNavigate('DealerTabs');
          } else {
            // Unknown status - log and navigate to registration
            console.warn('SplashScreen: ⚠️ Unknown business registration status:', businessRegistration.status, '- Navigating to BusinessRegistration');
            resetAndNavigate('BusinessRegistration');
          }
        } catch (error: any) {
          // If check fails with 404, redirect to registration
          // Otherwise allow access (might be network error)
          const errorStatus = error?.response?.status;
          if (errorStatus === 404) {
            resetAndNavigate('BusinessRegistration');
          } else {
            // Network error or other - navigate to tabs, will be handled there
            console.error('Error checking business registration:', error);
            resetAndNavigate('DealerTabs');
          }
        }
      } else {
        resetAndNavigate('DealerTabs');
      }
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
        const { logout } = useAuthStore.getState();
        logout();
        resetAndNavigate('CustomerLogin');
      }
    } catch (error) {
      tokenStorage.clearAll();
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
    backgroundColor: Colors.primary,
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
