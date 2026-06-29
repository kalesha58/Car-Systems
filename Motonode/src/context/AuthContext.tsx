import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getJSON, getString, remove, setJSON, setString, StorageKeys } from '@storage/index';
import type { AuthUser, UserRole } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  switchRole: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const MOCK_CUSTOMER: AuthUser = {
  id: 'u1',
  name: 'Arjun Sharma',
  email: 'arjun@example.com',
  phone: '+91 98765 43210',
  role: 'customer',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  location: 'Koramangala, Bengaluru',
};

const MOCK_DEALER: AuthUser = {
  id: 'd1',
  name: 'Speed Auto Parts',
  email: 'dealer@example.com',
  phone: '+91 80001 10001',
  role: 'dealer',
  dealerType: 'Spare Parts Dealer',
  location: 'Indiranagar, Bengaluru',
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
      const [storedUser, onboarded] = await Promise.all([
        getJSON<AuthUser>(StorageKeys.USER),
        getString(StorageKeys.ONBOARDED),
      ]);

      if (mounted && storedUser) {
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

  const login = useCallback(async (_email: string, _password: string, role: UserRole = 'customer') => {
    const mockUser = role === 'dealer' ? MOCK_DEALER : MOCK_CUSTOMER;
    setUser(mockUser);
    await setJSON(StorageKeys.USER, mockUser);
    await setString(StorageKeys.AUTH_TOKEN, `mock-token-${mockUser.id}`);
  }, []);

  const register = useCallback(
    async (name: string, email: string, _password: string, role: UserRole = 'customer') => {
      const newUser: AuthUser = {
        id: Date.now().toString(),
        name,
        email,
        phone: '',
        role,
        location: 'Bengaluru, Karnataka',
      };
      setUser(newUser);
      await setJSON(StorageKeys.USER, newUser);
      await setString(StorageKeys.AUTH_TOKEN, `mock-token-${newUser.id}`);
    },
    [],
  );

  const logout = useCallback(async () => {
    setUser(null);
    await remove(StorageKeys.USER);
    await remove(StorageKeys.AUTH_TOKEN);
  }, []);

  const completeOnboarding = useCallback(async () => {
    setIsOnboarded(true);
    await setString(StorageKeys.ONBOARDED, 'true');
  }, []);

  const switchRole = useCallback(() => {
    if (!user) {
      return;
    }
    const newRole: UserRole = user.role === 'customer' ? 'dealer' : 'customer';
    const switched = newRole === 'dealer' ? MOCK_DEALER : MOCK_CUSTOMER;
    setUser(switched);
    void setJSON(StorageKeys.USER, switched);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      isOnboarded,
      login,
      register,
      logout,
      completeOnboarding,
      switchRole,
    }),
    [user, isLoading, isOnboarded, login, register, logout, completeOnboarding, switchRole],
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
