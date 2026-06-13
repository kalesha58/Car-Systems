/**
 * Services Index
 * Centralized export for all API services
 */

export { default as apiClient } from './apiClient';
export * from './authService';
export * from './categoryService';
export * from './dashboardService';
export * from './dealerService';
export { 
  getBusinessRegistrationById, 
  getBusinessRegistrationByUserId, 
  type IUpdateBusinessRegistrationPayload, 
  updateBusinessRegistration 
} from './dealerService';
export * from './orderService';
export * from './productService';
export * from './reportService';
export * from './settingsService';
export type { IResetPasswordPayload } from './userService';
export { 
  sendResetPasswordCode, 
  verifyResetPasswordCode,
} from './userService';
export * from './vehicleService';
