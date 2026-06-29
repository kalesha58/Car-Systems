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
  DealerStore: 'DealerStore',
  ServiceDetail: 'ServiceDetail',
  DriveDetail: 'DriveDetail',
  MyOrders: 'MyOrders',
  OrderTracking: 'OrderTracking',
  Checkout: 'Checkout',
  Payment: 'Payment',
  ServiceBookingDateTime: 'ServiceBookingDateTime',
  ServiceBookingVehicle: 'ServiceBookingVehicle',
  ServiceBookingLocation: 'ServiceBookingLocation',
  ServiceBookingAddons: 'ServiceBookingAddons',
  ServiceBookingSummary: 'ServiceBookingSummary',
  ServiceBookingPayment: 'ServiceBookingPayment',
  ServiceBookingConfirmed: 'ServiceBookingConfirmed',
  ServiceBookingTracking: 'ServiceBookingTracking',
  BookingDetail: 'BookingDetail',
  CreateCommunityPost: 'CreateCommunityPost',
  AddVehicle: 'AddVehicle',
  GarageVehicleDetail: 'GarageVehicleDetail',
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
  StoreSettings: 'StoreSettings',
  BankDetails: 'BankDetails',
  GSTInfo: 'GSTInfo',
  UPIAccounts: 'UPIAccounts',
  NotificationSettings: 'NotificationSettings',
  ServiceBookings: 'ServiceBookings',
  DealerBookingDetail: 'DealerBookingDetail',
} as const;

export const RootRoutes = {
  Auth: 'Auth',
  Customer: 'Customer',
  Dealer: 'Dealer',
} as const;
