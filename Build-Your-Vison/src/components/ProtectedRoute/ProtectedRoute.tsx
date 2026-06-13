import { useAuthStore } from '@store/authStore';
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface IProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<IProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

