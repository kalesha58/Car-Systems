import { LoadingSpinner } from '@components/LoadingSpinner/LoadingSpinner';
import { ProtectedRoute } from '@components/ProtectedRoute/ProtectedRoute';
// @ts-expect-error: Module '@layouts' may not have type declarations
import { MainLayout } from '@layouts';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

// Lazy load pages
const LoginPage = lazy(() => import('@pages/Auth/LoginPage').then(module => ({ default: module.LoginPage })));
const ForgotPasswordPage = lazy(() => import('@pages/Auth/ForgotPasswordPage').then(module => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@pages/Auth/ResetPasswordPage').then(module => ({ default: module.ResetPasswordPage })));
const DashboardPage = lazy(() => import('@pages/Dashboard/DashboardPage').then(module => ({ default: module.DashboardPage })));
const UsersListPage = lazy(() => import('@pages/Users/UsersListPage').then(module => ({ default: module.UsersListPage })));
const UserDetailsPage = lazy(() => import('@pages/Users/UserDetailsPage').then(module => ({ default: module.UserDetailsPage })));
const UserFormPage = lazy(() => import('@pages/Users/UserFormPage').then(module => ({ default: module.UserFormPage })));
const DealersListPage = lazy(() => import('@pages/Dealers/DealersListPage').then(module => ({ default: module.DealersListPage })));
// const DealerDetailsPage = lazy(() => import('@pages/Dealers/DealerDetailsPage').then(module => ({ default: module.DealerDetailsPage })));
const DealerFormPage = lazy(() => import('@pages/Dealers/DealerFormPage').then(module => ({ default: module.DealerFormPage })));
const ProductsListPage = lazy(() => import('@pages/Products/ProductsListPage').then(module => ({ default: module.ProductsListPage })));
const ProductDetailsPage = lazy(() => import('@pages/Products/ProductDetailsPage').then(module => ({ default: module.ProductDetailsPage })));
const ProductFormPage = lazy(() => import('@pages/Products/ProductFormPage').then(module => ({ default: module.ProductFormPage })));
const VehiclesListPage = lazy(() => import('@pages/Vehicles/VehiclesListPage').then(module => ({ default: module.VehiclesListPage })));
const VehicleDetailsPage = lazy(() => import('@pages/Vehicles/VehicleDetailsPage').then(module => ({ default: module.VehicleDetailsPage })));
const VehicleFormPage = lazy(() => import('@pages/Vehicles/VehicleFormPage').then(module => ({ default: module.VehicleFormPage })));
const OrdersListPage = lazy(() => import('@pages/Orders/OrdersListPage').then(module => ({ default: module.OrdersListPage })));
const OrderDetailsPage = lazy(() => import('@pages/Orders/OrderDetailsPage').then(module => ({ default: module.OrderDetailsPage })));
const ReportsPage = lazy(() => import('@pages/Reports/ReportsPage').then(module => ({ default: module.ReportsPage })));
const CategoriesPage = lazy(() => import('@pages/Settings/CategoriesPage').then(module => ({ default: module.CategoriesPage })));
const NotFoundPage = lazy(() => import('@pages/NotFound/NotFoundPage').then(module => ({ default: module.NotFoundPage })));
const DeleteAccountPage = lazy(() =>
  import('@pages/Public/DeleteAccountPage').then(module => ({ default: module.DeleteAccountPage })),
);

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
    <LoadingSpinner size="lg" />
  </div>
);

export const AppRouter = () => {
  return (
    <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <Suspense fallback={<PageLoader />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <Suspense fallback={<PageLoader />}>
              <ForgotPasswordPage />
            </Suspense>
          }
        />
        <Route
          path="/reset-password"
          element={
            <Suspense fallback={<PageLoader />}>
              <ResetPasswordPage />
            </Suspense>
          }
        />
        <Route
          path="/delete-account"
          element={
            <Suspense fallback={<PageLoader />}>
              <DeleteAccountPage />
            </Suspense>
          }
        />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<PageLoader />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="users"
            element={
              <Suspense fallback={<PageLoader />}>
                <UsersListPage />
              </Suspense>
            }
          />
          <Route
            path="users/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <UserDetailsPage />
              </Suspense>
            }
          />
          <Route
            path="users/:id/edit"
            element={
              <Suspense fallback={<PageLoader />}>
                <UserFormPage />
              </Suspense>
            }
          />
          <Route
            path="users/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <UserFormPage />
              </Suspense>
            }
          />
          <Route
            path="dealers"
            element={
              <Suspense fallback={<PageLoader />}>
                <DealersListPage />
              </Suspense>
            }
          />
          <Route
            path="dealers/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <UserDetailsPage />
              </Suspense>
            }
          />
          <Route
            path="dealers/:id/edit"
            element={
              <Suspense fallback={<PageLoader />}>
                <DealerFormPage />
              </Suspense>
            }
          />
          <Route
            path="dealers/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <DealerFormPage />
              </Suspense>
            }
          />
          <Route
            path="products"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProductsListPage />
              </Suspense>
            }
          />
          <Route
            path="products/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProductFormPage />
              </Suspense>
            }
          />
          <Route
            path="products/:id/edit"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProductFormPage />
              </Suspense>
            }
          />
          <Route
            path="products/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProductDetailsPage />
              </Suspense>
            }
          />
          <Route
            path="vehicles"
            element={
              <Suspense fallback={<PageLoader />}>
                <VehiclesListPage />
              </Suspense>
            }
          />
          <Route
            path="vehicles/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <VehicleFormPage />
              </Suspense>
            }
          />
          <Route
            path="vehicles/:dealerId/:id/edit"
            element={
              <Suspense fallback={<PageLoader />}>
                <VehicleFormPage />
              </Suspense>
            }
          />
          <Route
            path="vehicles/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <VehicleDetailsPage />
              </Suspense>
            }
          />
          <Route
            path="orders"
            element={
              <Suspense fallback={<PageLoader />}>
                <OrdersListPage />
              </Suspense>
            }
          />
          <Route
            path="orders/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <OrderDetailsPage />
              </Suspense>
            }
          />
          <Route
            path="reports"
            element={
              <Suspense fallback={<PageLoader />}>
                <ReportsPage />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<PageLoader />}>
                <CategoriesPage />
              </Suspense>
            }
          />
        </Route>

        {/* 404 - Not Found Page */}
        <Route
          path="*"
          element={
            <Suspense fallback={<PageLoader />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Routes>
  );
};
