export const StorageKeys = {
  AUTH_TOKEN: 'auth_token',
  USER: 'motonode_user',
  ONBOARDED: 'motonode_onboarded',
  CART: 'motonode_cart',
  WISHLIST: 'motonode_wishlist',
  THEME_MODE: 'theme_mode',
  DEALER_TYPE: '@motonode_dealer_type',
  BUSINESS_PROFILE: '@motonode_business_profile',
  REGISTRATION_COMPLETED: '@motonode_registration_completed',
  DEALER_PRODUCTS: '@motonode_dealer_products',
  DEALER_VEHICLES: '@motonode_dealer_vehicles',
  DEALER_SERVICES: '@motonode_dealer_services',
  DEALER_ORDERS: '@motonode_dealer_orders',
  DRIVE_BOOKINGS: '@motonode_drive_bookings',
  CUSTOMER_BOOKINGS: '@motonode_customer_bookings',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
