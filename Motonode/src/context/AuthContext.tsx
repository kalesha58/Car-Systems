import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { login as loginApi, logout as logoutApi, signup as signupApi } from '@services/auth.service';
import { getString, getJSON, remove, setJSON, setString, StorageKeys } from '@storage/index';
import { mapServerUserToAuthUser } from '@utils/mapAuthUser';
import type { LoginResult } from '../types/api';
import type { AuthUser, UserRole } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;
  login: (email: string, password: string) => Promise<LoginResult | null>;
  register: (
    name: string,
    email: string,
    phone: string,
    password: string,
    role?: UserRole,
  ) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const GUEST_USER: AuthUser = {
  id: 'guest_user',
  name: 'Guest User',
  email: 'guest@motonode.com',
  phone: '',
  role: 'customer',
  location: 'Browsing as Guest',
  isGuest: true,
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function hydrateAuth() {
      const [storedUser, accessToken, onboarded] = await Promise.all([
        getJSON<AuthUser>(StorageKeys.USER),
        getString(StorageKeys.ACCESS_TOKEN),
        getString(StorageKeys.ONBOARDED),
      ]);

      if (mounted && storedUser && (accessToken || storedUser.isGuest)) {
        setUser(storedUser);
      }
      if (mounted && onboarded === 'true') {
        setIsOnboarded(true);
      }
      if (mounted) {
        setIsLoading(false);
      }
    }

    hydrateAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult | null> => {
    const result = await loginApi(email, password);
    const authUser = mapServerUserToAuthUser(result.user);

    setUser(authUser);
    await setJSON(StorageKeys.USER, authUser);

    return result;
  }, []);

  const register = useCallback(
    async (
      name: string,
      email: string,
      phone: string,
      password: string,
      role: UserRole = 'customer',
    ) => {
      await signupApi(
        name,
        email,
        phone,
        password,
        role === 'dealer' ? 'dealer' : 'user',
      );
    },
    [],
  );

  const loginAsGuest = useCallback(async () => {
    setUser(GUEST_USER);
    await setJSON(StorageKeys.USER, GUEST_USER);
  }, []);

  const logout = useCallback(async () => {
    if (user?.isGuest) {
      setUser(null);
      await remove(StorageKeys.USER);
      return;
    }

    await logoutApi();
    setUser(null);
    await remove(StorageKeys.USER);
  }, [user?.isGuest]);

  const completeOnboarding = useCallback(async () => {
    setIsOnboarded(true);
    await setString(StorageKeys.ONBOARDED, 'true');
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      isOnboarded,
      login,
      register,
      loginAsGuest,
      logout,
      completeOnboarding,
    }),
    [user, isLoading, isOnboarded, login, register, loginAsGuest, logout, completeOnboarding],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
