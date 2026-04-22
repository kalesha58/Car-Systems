/**
 * API Constants
 * Centralized configuration for API endpoints and base URL
 */

//export const API_BASE_URL = 'https://geognostical-uncoagulating-wilton.ngrok-free.dev';
//export const API_BASE_URL = 'http://localhost:4001/';
export const API_BASE_URL = 'https://car-systems.onrender.com/';
//export const API_BASE_URL= 'https://api.motonode.in/';
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
  },

  // Dashboard
  DASHBOARD: {
    STATS: '/admin/dashboard/stats',
    CHARTS: {
      USERS: '/admin/dashboard/charts/users',
      ORDERS: '/admin/dashboard/charts/orders',
      ORDER_STATUS: '/admin/dashboard/charts/order-status',
    },
  },

  // Users
  USERS: {
    BASE: '/admin/users',
    BY_ID: (id: string) => `/admin/users/${id}`,
    STATUS: (id: string) => `/admin/users/${id}/status`,
    RESET_PASSWORD: (id: string) => `/admin/users/${id}/reset-password`,
    ORDERS: (id: string) => `/admin/users/${id}/orders`,
    VEHICLES: (id: string) => `/admin/users/${id}/vehicles`,
  },

  // Dealers
  DEALERS: {
    BASE: '/admin/dealers',
    BY_ID: (id: string) => `/admin/dealers/${id}`,
    APPROVE: (id: string) => `/admin/dealers/${id}/approve`,
    REJECT: (id: string) => `/admin/dealers/${id}/reject`,
    SUSPEND: (id: string) => `/admin/dealers/${id}/suspend`,
    ORDERS: (id: string) => `/admin/dealers/${id}/orders`,
  },

  // Products
  PRODUCTS: {
    BASE: '/admin/products',
    BY_ID: (id: string) => `/admin/products/${id}`,
    STOCK: (id: string) => `/admin/products/${id}/stock`,
  },

  // Categories
  CATEGORIES: {
    BASE: '/admin/categories',
    BY_ID: (id: string) => `/admin/categories/${id}`,
  },

  // Orders
  ORDERS: {
    BASE: '/admin/orders',
    BY_ID: (id: string) => `/admin/orders/${id}`,
    STATUS: (id: string) => `/admin/orders/${id}/status`,
    CANCEL: (id: string) => `/admin/orders/${id}/cancel`,
    ASSIGN_DEALER: (id: string) => `/admin/orders/${id}/assign-dealer`,
    TRACKING: (id: string) => `/admin/orders/${id}/tracking`,
    TIMELINE: (id: string) => `/admin/orders/${id}/timeline`,
  },

  // Reports
  REPORTS: {
    SALES: '/admin/reports/sales',
    USERS: '/admin/reports/users',
    PRODUCTS: '/admin/reports/products',
    EXPORT: '/admin/reports/export',
  },

  // Settings
  SETTINGS: {
    BASE: '/admin/settings',
  },
} as const;

