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

  const navigateByRole = (userRole: string | null) => {
    if (userRole === 'user') {
      resetAndNavigate('ProductDashboard');
    } else if (userRole === 'dealer') {
      resetAndNavigate('ProductDashboard');
    } else if (userRole === 'admin') {
      resetAndNavigate('ProductDashboard');
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
          navigateByRole(userRole);
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
