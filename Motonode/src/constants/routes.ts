export const AuthRoutes = {
  Onboarding: 'Onboarding',
  Login: 'Login',
  Signup: 'Signup',
  OtpVerify: 'OtpVerify',
} as const;

export const CustomerTabRoutes = {
  Home: 'Home',
  Marketplace: 'Marketplace',
  Garage: 'Garage',
  Community: 'Community',
  Profile: 'Profile',
} as const;

export const CustomerStackRoutes = {
  CustomerTabs: 'CustomerTabs',
  Cart: 'Cart',
  Search: 'Search',
  Notifications: 'Notifications',
  ProductDetail: 'ProductDetail',
  VehicleDetail: 'VehicleDetail',
  AiAssistant: 'AiAssistant',
} as const;

export const DealerTabRoutes = {
  Dashboard: 'Dashboard',
  Inventory: 'Inventory',
  Orders: 'Orders',
  Drive: 'Drive',
  Profile: 'DealerProfile',
} as const;

export const DealerStackRoutes = {
  DealerTabs: 'DealerTabs',
  DealerType: 'DealerType',
  BusinessRegistration: 'BusinessRegistration',
  ProductForm: 'ProductForm',
  VehicleForm: 'VehicleForm',
  ServiceForm: 'ServiceForm',
} as const;

export const RootRoutes = {
  Auth: 'Auth',
  Customer: 'Customer',
  Dealer: 'Dealer',
} as const;
