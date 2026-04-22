# motonode Admin Panel - Technical Documentation

## 📋 Table of Contents

1. [Project Overview & Purpose](#project-overview--purpose)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Codebase Structure & Connections](#codebase-structure--connections)
5. [Admin Privileges & RBAC](#admin-privileges--rbac)
6. [Admin Panel Features & Flows](#admin-panel-features--flows)
7. [API Integration](#api-integration)
8. [Development Setup](#development-setup)
9. [Deployment Guide](#deployment-guide)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview & Purpose

### What is motonode Admin Panel?

motonode Admin Panel is a comprehensive web-based administration system designed to manage all aspects of the motonode marketplace platform. It provides administrators with complete control over users, dealers, products, vehicles, orders, and business analytics.

### Business Purpose

The admin panel serves as the central command center for:
- **User Management**: Oversee customer accounts, manage user roles, and handle account status
- **Dealer Management**: Approve, reject, or suspend dealer registrations and monitor dealer performance
- **Product & Vehicle Catalog**: Manage product inventory, vehicle listings, and category organization
- **Order Management**: Track orders, update statuses, assign dealers, and manage fulfillment
- **Business Intelligence**: Access real-time analytics, reports, and performance metrics
- **System Configuration**: Manage categories, settings, and platform-wide configurations

### Why This Project Exists

The motonode Admin Panel was built to:
1. **Centralize Management**: Provide a single interface for all administrative tasks
2. **Ensure Security**: Implement role-based access control to protect sensitive operations
3. **Enable Scalability**: Support growing user base and business operations
4. **Provide Insights**: Deliver actionable analytics for data-driven decision making
5. **Streamline Operations**: Automate workflows and reduce manual administrative overhead

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        motonode Admin Panel                   │
│                         (React SPA Frontend)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS/REST API
                             │ (JWT Authentication)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Backend API Server                           │
│                  (Node.js/Express - Port 4001)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Auth API   │  │  Admin API   │  │  Business    │         │
│  │   Endpoints  │  │  Endpoints   │  │  Logic       │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Database Queries
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      Database Layer                              │
│              (User Data, Orders, Products, etc.)                  │
└──────────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
App.tsx
│
├── ThemeProvider (Theme Context)
│
└── AppRouter
    │
    ├── Public Routes
    │   ├── /login → LoginPage
    │   ├── /forgot-password → ForgotPasswordPage
    │   └── /reset-password → ResetPasswordPage
    │
    └── Protected Routes (ProtectedRoute)
        │
        └── MainLayout
            │
            ├── Sidebar (Navigation)
            ├── Navbar (Top Bar)
            │
            └── Page Components (Outlet)
                ├── DashboardPage
                ├── UsersListPage → UserDetailsPage → UserFormPage
                ├── DealersListPage → DealerDetailsPage → DealerFormPage
                ├── ProductsListPage → ProductDetailsPage → ProductFormPage
                ├── VehiclesListPage → VehicleDetailsPage → VehicleFormPage
                ├── OrdersListPage → OrderDetailsPage
                ├── ReportsPage
                └── CategoriesPage (Settings)
```

### Data Flow Architecture

```
┌──────────────┐
│   User       │
│  (Browser)   │
└──────┬───────┘
       │
       │ 1. User Action (Click, Form Submit)
       │
┌──────▼─────────────────────────────────────────────┐
│           React Component Layer                    │
│  (Pages, Components, Forms, Tables)                │
└──────┬────────────────────────────────────────────┘
       │
       │ 2. Service Call
       │
┌──────▼─────────────────────────────────────────────┐
│           Service Layer                            │
│  (authService, userService, orderService, etc.)   │
└──────┬────────────────────────────────────────────┘
       │
       │ 3. API Request (via apiClient)
       │
┌──────▼─────────────────────────────────────────────┐
│           API Client (Axios)                       │
│  - Request Interceptor (Add JWT Token)              │
│  - Response Interceptor (Error Handling)           │
└──────┬────────────────────────────────────────────┘
       │
       │ 4. HTTP Request
       │
┌──────▼─────────────────────────────────────────────┐
│           Backend API                              │
│  (http://localhost:4001/api/*)                     │
└──────┬────────────────────────────────────────────┘
       │
       │ 5. Response Data
       │
┌──────▼─────────────────────────────────────────────┐
│           State Management (Zustand)               │
│  - authStore (User, Token, Auth State)             │
│  - sidebarStore (UI State)                        │
│  - toastStore (Notifications)                      │
└──────┬────────────────────────────────────────────┘
       │
       │ 6. State Update
       │
┌──────▼─────────────────────────────────────────────┐
│           UI Re-render                             │
│  (Components update with new data)                 │
└────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌──────────────┐
│   Login      │
│   Page       │
└──────┬───────┘
       │
       │ 1. User enters credentials
       │
┌──────▼─────────────────────────────────────────────┐
│  authService.login({ email, password })             │
└──────┬────────────────────────────────────────────┘
       │
       │ 2. POST /api/auth/login
       │
┌──────▼─────────────────────────────────────────────┐
│  Backend validates credentials                      │
│  Returns: { success, Response: { user }, token }    │
└──────┬────────────────────────────────────────────┘
       │
       │ 3. Check Admin Role
       │
┌──────▼─────────────────────────────────────────────┐
│  LoginPage checks if user.role includes 'admin'    │
│  If not admin → Show error, deny access            │
│  If admin → Continue                               │
└──────┬────────────────────────────────────────────┘
       │
       │ 4. Store Auth State
       │
┌──────▼─────────────────────────────────────────────┐
│  authStore.login(token, user)                      │
│  - Saves to Zustand store                          │
│  - Persists to localStorage                        │
└──────┬────────────────────────────────────────────┘
       │
       │ 5. Redirect
       │
┌──────▼─────────────────────────────────────────────┐
│  Navigate to /dashboard                            │
│  ProtectedRoute checks isAuthenticated → Allow     │
└────────────────────────────────────────────────────┘
```

### Admin Panel Flow Diagram

```
                    ┌─────────────────┐
                    │   Login Page    │
                    │  (Public Route) │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Authenticate   │
                    │  Check Admin    │
                    │     Role        │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Dashboard     │
                    │  (Overview)     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│  User Mgmt     │  │  Dealer Mgmt    │  │  Product Mgmt  │
│  - List        │  │  - List         │  │  - List        │
│  - View        │  │  - View         │  │  - View        │
│  - Create      │  │  - Approve      │  │  - Create      │
│  - Edit        │  │  - Reject       │  │  - Edit        │
│  - Block       │  │  - Suspend      │  │  - Delete      │
│  - Reset Pwd   │  │  - View Docs    │  │  - Manage Stock│
└────────────────┘  └────────────────┘  └────────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│  Vehicle Mgmt  │  │  Order Mgmt     │  │  Reports       │
│  - List        │  │  - List         │  │  - Sales       │
│  - View        │  │  - View         │  │  - Users       │
│  - Create      │  │  - Update Status│  │  - Products    │
│  - Edit        │  │  - Assign Dealer│  │  - Export      │
│  - Delete      │  │  - Add Tracking │  │                │
└────────────────┘  └────────────────┘  └────────────────┘
                             │
                    ┌────────▼────────┐
                    │    Settings     │
                    │  - Categories   │
                    │  - System Config│
                    └─────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI framework for building component-based interfaces |
| **TypeScript** | 5.2.2 | Type safety and enhanced developer experience |
| **Vite** | 5.0.8 | Fast build tool and development server |
| **React Router** | 6.20.0 | Client-side routing and navigation |
| **Zustand** | 4.4.7 | Lightweight state management |
| **Axios** | 1.6.2 | HTTP client for API requests |
| **Framer Motion** | 10.16.16 | Animation library for smooth UI transitions |
| **Tailwind CSS** | 3.4.18 | Utility-first CSS framework |
| **Recharts** | 2.10.3 | Chart library for data visualization |
| **Lucide React** | 0.554.0 | Icon library |

### Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting and quality enforcement |
| **Prettier** | Code formatting |
| **TypeScript ESLint** | TypeScript-specific linting rules |
| **Sass** | CSS preprocessor |

### Backend Integration

- **API Base URL**: `http://localhost:4001/` (Development)
- **Authentication**: JWT Bearer Token
- **API Pattern**: RESTful endpoints with `/admin/*` prefix

---

## 📁 Codebase Structure & Connections

### Complete Directory Structure

```
motonode-Admin/
│
├── public/                          # Static assets
│   └── vite.svg
│
├── src/
│   ├── assets/                      # Images, GIFs, static files
│   │   ├── gifs/
│   │   └── *.jpg
│   │
│   ├── components/                   # Reusable UI components
│   │   ├── Breadcrumbs/             # Navigation breadcrumbs
│   │   ├── BusinessRegistrationModal/ # Dealer registration modal
│   │   ├── Button/                  # Button component
│   │   ├── Card/                     # Card container
│   │   ├── ConfirmModal/            # Confirmation dialogs
│   │   ├── Gauge/                    # Progress gauge component
│   │   ├── ImagePreviewModal/       # Image viewer
│   │   ├── ImageSlider/              # Image carousel
│   │   ├── Input/                    # Form input fields
│   │   ├── LoadingSpinner/          # Loading indicator
│   │   ├── Modal/                    # Modal dialog wrapper
│   │   ├── Pagination/               # Pagination controls
│   │   ├── ProfileDropdown/         # User profile menu
│   │   ├── ProtectedRoute/           # Route protection HOC
│   │   ├── Select/                   # Dropdown select
│   │   ├── Skeleton/                 # Loading skeletons
│   │   ├── Table/                    # Data table component
│   │   ├── Toast/                    # Notification toasts
│   │   ├── Tooltip/                  # Tooltip component
│   │   ├── TourGuide/                # Onboarding tour
│   │   └── index.ts                  # Component exports
│   │
│   ├── constants/                    # Application constants
│   │   └── api.ts                    # API endpoints configuration
│   │
│   ├── data/                         # Mock data (development)
│   │   ├── mockCategories.json
│   │   ├── mockDashboard.json
│   │   ├── mockDealers.json
│   │   ├── mockOrders.json
│   │   ├── mockProducts.json
│   │   └── mockUsers.json
│   │
│   ├── features/                     # Feature modules
│   │   └── Home/
│   │       └── pages/
│   │
│   ├── hooks/                        # Custom React hooks
│   │   └── index.ts
│   │
│   ├── layouts/                      # Layout components
│   │   ├── MainLayout/               # Main app layout
│   │   ├── Navbar/                   # Top navigation bar
│   │   ├── Sidebar/                  # Side navigation menu
│   │   └── index.ts
│   │
│   ├── pages/                        # Page components
│   │   ├── Auth/                     # Authentication pages
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   └── ResetPasswordPage.tsx
│   │   │
│   │   ├── Dashboard/                # Dashboard page
│   │   │   └── DashboardPage.tsx
│   │   │
│   │   ├── Users/                    # User management
│   │   │   ├── UsersListPage.tsx
│   │   │   ├── UserDetailsPage.tsx
│   │   │   └── UserFormPage.tsx
│   │   │
│   │   ├── Dealers/                  # Dealer management
│   │   │   ├── DealersListPage.tsx
│   │   │   ├── DealerDetailsPage.tsx
│   │   │   └── DealerFormPage.tsx
│   │   │
│   │   ├── Products/                 # Product management
│   │   │   ├── ProductsListPage.tsx
│   │   │   ├── ProductDetailsPage.tsx
│   │   │   └── ProductFormPage.tsx
│   │   │
│   │   ├── Vehicles/                 # Vehicle management
│   │   │   ├── VehiclesListPage.tsx
│   │   │   ├── VehicleDetailsPage.tsx
│   │   │   └── VehicleFormPage.tsx
│   │   │
│   │   ├── Orders/                   # Order management
│   │   │   ├── OrdersListPage.tsx
│   │   │   └── OrderDetailsPage.tsx
│   │   │
│   │   ├── Reports/                  # Reports & analytics
│   │   │   └── ReportsPage.tsx
│   │   │
│   │   └── Settings/                 # Settings & configuration
│   │       └── CategoriesPage.tsx
│   │
│   ├── routes/                       # Routing configuration
│   │   └── AppRouter.tsx             # Main router with route definitions
│   │
│   ├── services/                     # API service layer
│   │   ├── apiClient.ts              # Axios instance with interceptors
│   │   ├── authService.ts            # Authentication APIs
│   │   ├── userService.ts            # User management APIs
│   │   ├── dealerService.ts          # Dealer management APIs
│   │   ├── productService.ts        # Product management APIs
│   │   ├── vehicleService.ts         # Vehicle management APIs
│   │   ├── orderService.ts           # Order management APIs
│   │   ├── categoryService.ts        # Category management APIs
│   │   ├── dashboardService.ts       # Dashboard data APIs
│   │   ├── reportService.ts          # Reports APIs
│   │   ├── settingsService.ts        # Settings APIs
│   │   └── index.ts                  # Service exports
│   │
│   ├── store/                        # Zustand state management
│   │   ├── authStore.ts              # Authentication state
│   │   ├── sidebarStore.ts           # Sidebar UI state
│   │   └── toastStore.ts             # Toast notification state
│   │
│   ├── theme/                        # Theming system
│   │   ├── theme.ts                  # Theme configuration
│   │   ├── colorSchemes.ts           # Color scheme definitions
│   │   └── ThemeContext.tsx          # Theme context provider
│   │
│   ├── types/                        # TypeScript type definitions
│   │   ├── auth.ts                   # Authentication types
│   │   ├── user.ts                   # User types
│   │   ├── dealer.ts                 # Dealer types
│   │   ├── product.ts                # Product types
│   │   ├── vehicle.ts                # Vehicle types
│   │   ├── order.ts                  # Order types
│   │   ├── category.ts               # Category types
│   │   ├── dashboard.ts              # Dashboard types
│   │   ├── notification.ts           # Notification types
│   │   └── index.ts                  # Type exports
│   │
│   ├── utils/                        # Utility functions
│   │   ├── dashboardDataProcessor.ts # Dashboard data processing
│   │   ├── debounce.ts               # Debounce utility
│   │   ├── errorHandler.ts           # Error handling utilities
│   │   ├── validation.ts             # Form validation utilities
│   │   └── index.ts                  # Utility exports
│   │
│   ├── App.tsx                       # Root component
│   ├── main.tsx                      # Application entry point
│   └── index.scss                    # Global styles
│
├── API_DOCUMENTATION.md              # API endpoint documentation
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
├── vite.config.ts                   # Vite configuration
├── tailwind.config.js               # Tailwind CSS configuration
└── README.md                         # This file
```

### Service Layer Connections

#### API Client Architecture

```typescript
// src/services/apiClient.ts
apiClient (Axios Instance)
│
├── Base Configuration
│   ├── baseURL: 'http://localhost:4001/'
│   ├── timeout: 30000ms
│   └── headers: { 'Content-Type': 'application/json' }
│
├── Request Interceptor
│   ├── Adds JWT token from authStore
│   ├── Adds 'ngrok-skip-browser-warning' header
│   └── Handles FormData content-type
│
└── Response Interceptor
    ├── Handles success: false responses
    ├── Shows error toasts
    ├── Handles 401 → Logout & redirect
    ├── Handles 403 → Permission error
    └── Handles network errors
```

#### Service to API Mapping

```
Service Layer                    →  API Endpoint
─────────────────────────────────────────────────────────────
authService.login()              →  POST /api/auth/login
authService.forgotPassword()     →  POST /api/auth/forgot-password
authService.resetPassword()      →  POST /api/auth/reset-password

userService.getUsers()           →  GET /admin/users
userService.getUserById()        →  GET /admin/users/:id
userService.createUser()         →  POST /admin/users
userService.updateUser()         →  PUT /admin/users/:id
userService.deleteUser()         →  DELETE /admin/users/:id
userService.updateUserStatus()   →  PATCH /admin/users/:id/status
userService.resetUserPassword()  →  POST /admin/users/:id/reset-password

dealerService.getDealers()       →  GET /admin/dealers
dealerService.getDealerById()    →  GET /admin/dealers/:id
dealerService.approveDealer()    →  POST /admin/dealers/:id/approve
dealerService.rejectDealer()     →  POST /admin/dealers/:id/reject
dealerService.suspendDealer()    →  POST /admin/dealers/:id/suspend

productService.getProducts()     →  GET /admin/products
productService.getProductById()  →  GET /admin/products/:id
productService.createProduct()   →  POST /admin/products
productService.updateProduct()   →  PUT /admin/products/:id
productService.deleteProduct()   →  DELETE /admin/products/:id

orderService.getOrders()         →  GET /admin/orders
orderService.getOrderById()      →  GET /admin/orders/:id
orderService.updateOrderStatus() →  PATCH /admin/orders/:id/status
orderService.cancelOrder()       →  POST /admin/orders/:id/cancel

dashboardService.getDashboardStats() → Aggregates from multiple APIs
```

### State Management Flow

```
Zustand Stores
│
├── authStore (Persisted)
│   ├── user: IUser | null
│   ├── token: string | null
│   ├── isAuthenticated: boolean
│   ├── login(token, user) → Sets auth state
│   └── logout() → Clears auth state & localStorage
│
├── sidebarStore
│   ├── isOpen: boolean
│   ├── open() → Opens sidebar
│   └── close() → Closes sidebar
│
└── toastStore
    ├── toasts: IToast[]
    ├── showToast(message, type) → Adds toast
    └── removeToast(id) → Removes toast
```

### Routing Structure

```typescript
// src/routes/AppRouter.tsx
Routes:
│
├── Public Routes (No Auth Required)
│   ├── /login → LoginPage
│   ├── /forgot-password → ForgotPasswordPage
│   └── /reset-password → ResetPasswordPage
│
└── Protected Routes (Auth Required)
    └── MainLayout (ProtectedRoute wrapper)
        ├── / → Redirect to /dashboard
        ├── /dashboard → DashboardPage
        ├── /users → UsersListPage
        ├── /users/:id → UserDetailsPage
        ├── /users/:id/edit → UserFormPage (Edit)
        ├── /users/new → UserFormPage (Create)
        ├── /dealers → DealersListPage
        ├── /dealers/:id → DealerDetailsPage
        ├── /dealers/:id/edit → DealerFormPage (Edit)
        ├── /dealers/new → DealerFormPage (Create)
        ├── /products → ProductsListPage
        ├── /products/:id → ProductDetailsPage
        ├── /products/:id/edit → ProductFormPage (Edit)
        ├── /products/new → ProductFormPage (Create)
        ├── /vehicles → VehiclesListPage
        ├── /vehicles/:id → VehicleDetailsPage
        ├── /vehicles/:dealerId/:id/edit → VehicleFormPage (Edit)
        ├── /vehicles/new → VehicleFormPage (Create)
        ├── /orders → OrdersListPage
        ├── /orders/:id → OrderDetailsPage
        ├── /reports → ReportsPage
        └── /settings → CategoriesPage
```

### Component Hierarchy

```
MainLayout
│
├── Sidebar
│   ├── Navigation Items (Dashboard, Users, Dealers, etc.)
│   └── Logout Button
│
├── Navbar
│   ├── Breadcrumbs
│   ├── Profile Dropdown
│   └── Theme Toggle
│
└── Page Content (Outlet)
    │
    ├── DashboardPage
    │   ├── KPI Cards (Gauge components)
    │   ├── Charts (Recharts)
    │   └── Recent Activity Tables
    │
    ├── UsersListPage
    │   ├── Search & Filters
    │   ├── Table (Table component)
    │   └── Pagination
    │
    ├── UserDetailsPage
    │   ├── User Info Card
    │   ├── Orders Table
    │   └── Vehicles Table
    │
    └── ... (Other pages follow similar patterns)
```

---

## 🔐 Admin Privileges & RBAC

### Role Definitions

The motonode Admin Panel implements a role-based access control (RBAC) system with the following roles:

#### 1. Admin Role
- **Purpose**: Full system access and control
- **Access Level**: Highest privilege
- **Required for**: Accessing the admin panel

#### 2. Dealer Role
- **Purpose**: Dealer account management
- **Access Level**: Limited (not used in admin panel)
- **Note**: Dealers are managed by admins, not accessed by dealers

#### 3. User Role
- **Purpose**: Regular customer account
- **Access Level**: Limited (not used in admin panel)
- **Note**: Users are managed by admins, not accessed by users

### Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Authentication Flow                        │
└─────────────────────────────────────────────────────────────┘

1. User attempts to access admin panel
   ↓
2. ProtectedRoute checks isAuthenticated
   ↓
3. If not authenticated → Redirect to /login
   ↓
4. User enters credentials on LoginPage
   ↓
5. authService.login() sends request to backend
   ↓
6. Backend validates credentials and returns:
   {
     success: true,
     Response: {
       id, name, email, phone,
       role: ['admin']  // Must include 'admin'
     },
     token: "JWT_TOKEN"
   }
   ↓
7. LoginPage checks if role includes 'admin'
   ↓
8. If NOT admin → Show error, deny access
   ↓
9. If admin → authStore.login(token, user)
   ↓
10. Token stored in Zustand (persisted to localStorage)
   ↓
11. Navigate to /dashboard
   ↓
12. All subsequent API requests include:
    Authorization: Bearer <token>
```

### Permission Matrix

| Feature | Admin | Dealer | User |
|---------|-------|--------|------|
| **Access Admin Panel** | ✅ | ❌ | ❌ |
| **View Dashboard** | ✅ | ❌ | ❌ |
| **Manage Users** | ✅ | ❌ | ❌ |
| **Manage Dealers** | ✅ | ❌ | ❌ |
| **Approve/Reject Dealers** | ✅ | ❌ | ❌ |
| **Manage Products** | ✅ | ❌ | ❌ |
| **Manage Vehicles** | ✅ | ❌ | ❌ |
| **Manage Orders** | ✅ | ❌ | ❌ |
| **View Reports** | ✅ | ❌ | ❌ |
| **Manage Categories** | ✅ | ❌ | ❌ |
| **Reset User Passwords** | ✅ | ❌ | ❌ |
| **Block/Unblock Users** | ✅ | ❌ | ❌ |

### Protected Route Mechanism

```typescript
// src/components/ProtectedRoute/ProtectedRoute.tsx
ProtectedRoute Component:
│
├── Checks: useAuthStore().isAuthenticated
│
├── If NOT authenticated:
│   └── <Navigate to="/login" replace />
│
└── If authenticated:
    └── Renders children (MainLayout + Routes)
```

### Role Validation in Login

```typescript
// src/pages/Auth/LoginPage.tsx
Login Flow:
│
├── User submits credentials
│
├── authService.login() called
│
├── Response received with user.role
│
├── Check: user.role.includes('admin')
│
├── If NOT admin:
│   ├── Show error: "You do not have admin privileges"
│   └── Deny access (do not store token)
│
└── If admin:
    ├── Store token in authStore
    └── Navigate to /dashboard
```

### Admin Capabilities

#### User Management
- ✅ View all users
- ✅ Create new users
- ✅ Edit user information
- ✅ Block/Unblock users
- ✅ Reset user passwords
- ✅ View user orders
- ✅ View user vehicles
- ✅ Assign roles (user, dealer, admin)

#### Dealer Management
- ✅ View all dealers
- ✅ View dealer registration requests
- ✅ Approve dealer registrations
- ✅ Reject dealer registrations
- ✅ Suspend active dealers
- ✅ View dealer documents
- ✅ View dealer orders
- ✅ Edit dealer information

#### Product Management
- ✅ View all products
- ✅ Create new products
- ✅ Edit product information
- ✅ Delete products
- ✅ Manage product stock
- ✅ Upload product images
- ✅ Manage product categories

#### Vehicle Management
- ✅ View all vehicles
- ✅ Create new vehicles
- ✅ Edit vehicle information
- ✅ Delete vehicles
- ✅ View vehicle details
- ✅ Manage vehicle images

#### Order Management
- ✅ View all orders
- ✅ View order details
- ✅ Update order status
- ✅ Cancel orders
- ✅ Assign dealers to orders
- ✅ Add tracking information
- ✅ View order timeline

#### Reports & Analytics
- ✅ View sales reports
- ✅ View user reports
- ✅ View product reports
- ✅ Export reports (Excel/PDF)
- ✅ View dashboard statistics
- ✅ View charts and graphs

#### Settings
- ✅ Manage categories
- ✅ Configure system settings
- ✅ Update platform configuration

---

## 🎯 Admin Panel Features & Flows

### 1. Authentication Flow

#### Login Process
```
1. User navigates to /login
2. Enters email and password
3. Clicks "Login" button
4. System validates credentials
5. System checks for 'admin' role
6. If valid admin → Store token, redirect to dashboard
7. If invalid → Show error message
```

#### Forgot Password Flow
```
1. User clicks "Forgot Password" on login page
2. Enters email address
3. System sends OTP code to email
4. User enters OTP code and new password
5. System validates and resets password
6. User can now login with new password
```

### 2. Dashboard Overview

#### Dashboard Features
- **KPI Cards**: Total Users, Dealers, Orders, Products, Revenue
- **Growth Indicators**: Percentage change from previous period
- **Charts**: 
  - User registration trends (line chart)
  - Order trends (line chart)
  - Order status distribution (pie chart)
- **Recent Activity**: Latest orders, new users, pending dealer approvals

#### Dashboard Data Flow
```
DashboardPage Component
│
├── useEffect → Fetch data on mount
│
├── getDashboardStats()
│   ├── fetchAllUsers() → Paginate through all users
│   ├── fetchAllDealers() → Get users with role='dealer'
│   ├── fetchAllOrders() → Paginate through all orders
│   └── getProducts() → Get product count
│
├── getUsersChartData() → Process user data by month
├── getOrdersChartData() → Process order data by month
└── getOrderStatusDistribution() → Count orders by status
```

### 3. User Management Flow

#### User List Page
```
1. Navigate to /users
2. Page loads with pagination (default: page 1, limit 10)
3. Table displays: Name, Email, Phone, Status, Role, Actions
4. Search functionality filters users in real-time
5. Status filter: All, Active, Inactive, Blocked
6. Click user row → Navigate to user details
7. Click "Edit" → Navigate to edit form
8. Click "Delete" → Show confirmation modal
```

#### Create User Flow
```
1. Navigate to /users/new
2. Fill form: Name, Email, Phone, Password, Roles
3. Select roles: User, Dealer, Admin (can select multiple)
4. Click "Create User"
5. System validates form
6. API call: POST /admin/users
7. On success → Show toast, redirect to user list
8. On error → Show error toast
```

#### Edit User Flow
```
1. Navigate to /users/:id/edit
2. Form pre-filled with user data
3. Edit fields: Name, Phone, Status, Roles
4. Email cannot be changed
5. Click "Update User"
6. API call: PUT /admin/users/:id
7. On success → Show toast, redirect to user details
```

#### User Details Flow
```
1. Navigate to /users/:id
2. Display user information card
3. Display user orders table (paginated)
4. Display user vehicles table
5. Actions available:
   - Edit User
   - Block/Unblock User
   - Reset Password
   - Delete User
```

#### Reset Password Flow
```
1. From User Details page, click "Reset Password"
2. Modal opens with form
3. Option 1: Send OTP to user's email
   - Click "Send Code"
   - User receives 6-digit OTP
   - Enter OTP + New Password
   - Verify and update
4. Option 2: Direct reset (if backend supports)
   - Enter new password directly
   - Update without OTP
```

### 4. Dealer Management Flow

#### Dealer List Page
```
1. Navigate to /dealers
2. Table displays: Name, Business Name, Email, Phone, Status, Location
3. Status filter: All, Pending, Approved, Rejected, Suspended
4. Search by name, business name, email
5. Click dealer row → View details
```

#### Dealer Registration Approval Flow
```
1. Navigate to /dealers
2. View dealers with status "pending"
3. Click "View Registration" → Opens BusinessRegistrationViewModal
4. Review dealer documents and information
5. Actions:
   - Approve → POST /admin/dealers/:id/approve
   - Reject → POST /admin/dealers/:id/reject (with reason)
   - Suspend → POST /admin/dealers/:id/suspend (with reason)
```

#### Dealer Details Flow
```
1. Navigate to /dealers/:id
2. Display dealer information
3. Display dealer documents (if any)
4. Display dealer orders
5. Display dealer reviews/ratings
6. Actions:
   - Edit Dealer
   - Approve/Reject/Suspend
   - View Documents
```

### 5. Product Management Flow

#### Product List Page
```
1. Navigate to /products
2. Table displays: Name, Category, Price, Stock, Status
3. Filters: Category, Status, Price Range
4. Search by product name
5. Click product → View details
6. Click "Add Product" → Create new product
```

#### Create Product Flow
```
1. Navigate to /products/new
2. Fill form:
   - Name, Category, Price, Stock
   - Description, Tags
   - Specifications (key-value pairs)
   - Images (upload multiple)
3. Click "Create Product"
4. API call: POST /admin/products (with FormData for images)
5. On success → Redirect to product list
```

#### Product Stock Management
```
1. From Product Details or List
2. Click "Update Stock"
3. Options:
   - Set stock to specific value
   - Add to current stock
   - Subtract from current stock
4. API call: PATCH /admin/products/:id/stock
```

### 6. Vehicle Management Flow

#### Vehicle List Page
```
1. Navigate to /vehicles
2. Table displays: Brand, Model, Year, Price, Dealer, Status
3. Filters: Brand, Model, Dealer, Status
4. Search functionality
5. Click vehicle → View details
```

#### Create Vehicle Flow
```
1. Navigate to /vehicles/new
2. Fill form:
   - Dealer selection (required)
   - Brand, Model, Year
   - Price, Mileage
   - Description, Features
   - Images (upload multiple)
3. Click "Create Vehicle"
4. API call: POST /admin/vehicles
5. On success → Redirect to vehicle list
```

### 7. Order Management Flow

#### Order List Page
```
1. Navigate to /orders
2. Table displays: Order #, User, Dealer, Amount, Status, Date
3. Filters: Status, Dealer, User, Date Range
4. Search by order number
5. Click order → View details
```

#### Order Details Flow
```
1. Navigate to /orders/:id
2. Display order information:
   - Order number, date, status
   - User information
   - Dealer information
   - Order items (products/vehicles)
   - Pricing breakdown (subtotal, tax, shipping, total)
   - Payment information
   - Shipping address
   - Billing address
   - Tracking information
   - Order timeline
3. Actions:
   - Update Status
   - Assign Dealer
   - Add Tracking
   - Cancel Order
```

#### Update Order Status Flow
```
1. From Order Details, click "Update Status"
2. Select new status: Pending, Processing, Shipped, Delivered, Cancelled
3. Add optional notes
4. API call: PATCH /admin/orders/:id/status
5. Status updated in timeline
```

#### Assign Dealer to Order
```
1. From Order Details, click "Assign Dealer"
2. Select dealer from dropdown
3. API call: POST /admin/orders/:id/assign-dealer
4. Dealer assigned to order
```

### 8. Reports & Analytics Flow

#### Reports Page
```
1. Navigate to /reports
2. Select report type:
   - Sales Report
   - Users Report
   - Products Report
3. Set date range (start date, end date)
4. Click "Generate Report"
5. View report data in tables/charts
6. Option to export: Excel or PDF
```

#### Sales Report
- Total sales amount
- Total number of orders
- Sales by date/period
- Sales by dealer
- Revenue trends

#### Users Report
- Total users
- New users (in period)
- Active users
- User growth trends
- User distribution by role

#### Products Report
- Top selling products
- Low stock products
- Product performance
- Category distribution

### 9. Settings & Categories Flow

#### Categories Management
```
1. Navigate to /settings (Categories page)
2. View all categories in table
3. Actions:
   - Create Category
   - Edit Category
   - Delete Category
   - Enable/Disable Category
```

#### Create Category Flow
```
1. Click "Add Category"
2. Fill form: Name, Description, Status
3. Click "Create"
4. API call: POST /admin/categories
5. Category added to list
```

---

## 🔌 API Integration

### API Configuration

#### Base URL
- **Development**: `http://localhost:4001/`
- **Production**: Configure in `src/constants/api.ts`

#### Authentication
All protected endpoints require JWT Bearer token:
```
Authorization: Bearer <token>
```

### API Client Setup

```typescript
// src/services/apiClient.ts
- Base URL: Configured in constants/api.ts
- Timeout: 30 seconds
- Request Interceptor: Adds JWT token automatically
- Response Interceptor: Handles errors globally
```

### API Endpoints Structure

All admin endpoints are prefixed with `/admin/*`:

```
/api/auth/*              → Authentication (public)
/admin/users/*           → User management
/admin/dealers/*         → Dealer management
/admin/products/*       → Product management
/admin/vehicles/*        → Vehicle management
/admin/orders/*          → Order management
/admin/categories/*      → Category management
/admin/dashboard/*       → Dashboard data
/admin/reports/*         → Reports data
/admin/settings/*        → Settings
```

### Request/Response Patterns

#### Success Response
```json
{
  "success": true,
  "Response": {
    // Data object
  }
}
```

#### Error Response
```json
{
  "success": false,
  "Response": {
    "ReturnMessage": "Error message here"
  }
}
```

#### Pagination Response
```json
{
  "users": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Handling

The API client automatically handles:
- **401 Unauthorized**: Logs out user, redirects to login
- **403 Forbidden**: Shows permission error
- **404 Not Found**: Shows not found message
- **500+ Server Errors**: Shows server error message
- **Network Errors**: Shows connection error

### API Service Layer

Each feature has a dedicated service file:
- `authService.ts` - Authentication
- `userService.ts` - User management
- `dealerService.ts` - Dealer management
- `productService.ts` - Product management
- `vehicleService.ts` - Vehicle management
- `orderService.ts` - Order management
- `categoryService.ts` - Category management
- `dashboardService.ts` - Dashboard aggregation
- `reportService.ts` - Reports
- `settingsService.ts` - Settings

See `API_DOCUMENTATION.md` for complete endpoint documentation.

---

## 🚀 Development Setup

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher (or yarn)
- **Backend API**: Running on `http://localhost:4001/`

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd motonode-Admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Base URL**
   - Edit `src/constants/api.ts`
   - Update `API_BASE_URL` to match your backend

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   - Navigate to `http://localhost:5173`
   - Login with admin credentials

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (Vite) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Fix ESLint errors automatically |
| `npm run format` | Format code with Prettier |

### Environment Variables

Currently, API base URL is hardcoded in `src/constants/api.ts`. For production, consider using environment variables:

```typescript
// .env.development
VITE_API_BASE_URL=http://localhost:4001/

// .env.production
VITE_API_BASE_URL=https://api.carconnect.com/
```

### Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**
   - Follow code standards (see Code Standards section)
   - Write TypeScript with proper types
   - Use existing components where possible

3. **Test locally**
   - Run `npm run dev`
   - Test all affected features
   - Check for console errors

4. **Lint and format**
   ```bash
   npm run lint:fix
   npm run format
   ```

5. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

### Code Standards

- ❌ **No `console.log` in production code**
- 🔁 **No unused variables or imports**
- 🧹 **Auto-format with ESLint + Prettier**
- 📦 **Sort imports** (simple-import-sort)
- 📜 **Semicolons required**
- 🧩 **Interfaces prefixed with `I`**
- 📁 **Feature-based folder structure**
- 🎨 **Centralized theming**
- 🌐 **No hardcoded strings** (use i18n when implemented)

### Path Aliases

The project uses path aliases for cleaner imports:

```typescript
@components → src/components
@pages → src/pages
@services → src/services
@types → src/types
@utils → src/utils
@store → src/store
@theme → src/theme
@layouts → src/layouts
@constants → src/constants
```

Configured in `tsconfig.json` and `vite.config.ts`.

---

## 📦 Deployment Guide

### Production Build

1. **Build the application**
   ```bash
   npm run build
   ```
   This creates a `dist/` folder with optimized production files.

2. **Preview production build**
   ```bash
   npm run preview
   ```
   Test the production build locally before deploying.

### Deployment Options

#### Option 1: Static Hosting (Vercel, Netlify, GitHub Pages)

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy `dist/` folder**
   - Upload to hosting service
   - Configure redirects for SPA routing

3. **Environment Configuration**
   - Set `VITE_API_BASE_URL` to production API URL
   - Rebuild after setting environment variables

#### Option 2: Traditional Web Server (Nginx, Apache)

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Copy `dist/` contents to web server**
   ```bash
   cp -r dist/* /var/www/html/
   ```

3. **Configure server for SPA routing**
   - Nginx: Add try_files directive
   - Apache: Enable mod_rewrite

#### Option 3: Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Build and run**
   ```bash
   docker build -t motonode-admin .
   docker run -p 80:80 motonode-admin
   ```

### Production Checklist

- [ ] Update API base URL to production endpoint
- [ ] Remove console.log statements
- [ ] Test all features in production build
- [ ] Verify authentication flow
- [ ] Check error handling
- [ ] Test on different browsers
- [ ] Verify responsive design
- [ ] Check performance (Lighthouse)
- [ ] Set up error tracking (if applicable)
- [ ] Configure CORS on backend
- [ ] Set up HTTPS
- [ ] Configure CDN (if applicable)

### Environment Configuration

For production, use environment variables:

```bash
# .env.production
VITE_API_BASE_URL=https://api.carconnect.com/
VITE_APP_NAME=motonode Admin
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. API Connection Errors

**Problem**: Cannot connect to backend API

**Solutions**:
- Verify backend is running on `http://localhost:4001/`
- Check `API_BASE_URL` in `src/constants/api.ts`
- Check browser console for CORS errors
- Verify network connectivity

#### 2. Authentication Issues

**Problem**: Login fails or token expires

**Solutions**:
- Check backend authentication endpoint
- Verify JWT token format
- Clear localStorage: `localStorage.clear()`
- Check token expiration time
- Verify admin role in user object

#### 3. Build Errors

**Problem**: `npm run build` fails

**Solutions**:
- Check TypeScript errors: `npm run lint`
- Verify all imports are correct
- Check for missing dependencies
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

#### 4. Routing Issues

**Problem**: 404 errors on page refresh

**Solutions**:
- Configure server to redirect all routes to `index.html`
- For Vite dev server, this is handled automatically
- For production, configure server rewrite rules

#### 5. Styling Issues

**Problem**: Styles not applying correctly

**Solutions**:
- Clear browser cache
- Verify Tailwind CSS configuration
- Check for conflicting CSS
- Verify dark mode theme configuration

#### 6. State Not Persisting

**Problem**: Auth state lost on page refresh

**Solutions**:
- Check Zustand persist configuration in `authStore.ts`
- Verify localStorage is enabled
- Check browser storage permissions

### Debugging Tips

1. **Check Browser Console**
   - Open DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for API calls

2. **Check Network Requests**
   - Open DevTools → Network tab
   - Filter by XHR/Fetch
   - Check request/response details
   - Verify headers (Authorization token)

3. **Check Application State**
   - Open DevTools → Application tab
   - Check Local Storage for auth data
   - Verify Zustand store state

4. **React DevTools**
   - Install React DevTools browser extension
   - Inspect component props and state
   - Check component hierarchy

### Getting Help

If you encounter issues not covered here:

1. Check the browser console for error messages
2. Review API documentation in `API_DOCUMENTATION.md`
3. Check backend API logs
4. Review component code for specific features
5. Check service layer for API call issues

---

## 📝 Additional Resources

- **API Documentation**: See `API_DOCUMENTATION.md` for complete API reference
- **Code Standards**: Follow project coding standards (see user rules)
- **Component Library**: Reusable components in `src/components/`
- **Type Definitions**: All TypeScript types in `src/types/`

---

## 📄 License

[Add your license information here]

---

## 👥 Contributors

[Add contributor information here]

---

**Last Updated**: [Current Date]
**Version**: 0.0.1
