import type { LinkingOptions } from '@react-navigation/native';

import {
  AuthRoutes,
  CustomerStackRoutes,
  CustomerTabRoutes,
  DealerStackRoutes,
  DealerTabRoutes,
  RootRoutes,
} from '@constants/routes';
import type { RootStackParamList } from './RootNavigator';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    'motonode://',
    'https://motonode.in',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
  ],
  config: {
    screens: {
      [RootRoutes.Auth]: {
        screens: {
          [AuthRoutes.Onboarding]: 'onboarding',
          [AuthRoutes.Login]: 'login',
          [AuthRoutes.Signup]: 'signup',
          [AuthRoutes.OtpVerify]: 'otp-verify',
        },
      },
      [RootRoutes.Customer]: {
        screens: {
          [CustomerStackRoutes.CustomerTabs]: {
            screens: {
              [CustomerTabRoutes.Home]: 'home',
              [CustomerTabRoutes.Marketplace]: 'marketplace',
              [CustomerTabRoutes.Garage]: 'garage',
              [CustomerTabRoutes.Community]: 'community',
              [CustomerTabRoutes.Profile]: 'profile',
            },
          },
          [CustomerStackRoutes.Cart]: 'cart',
          [CustomerStackRoutes.Search]: 'search',
          [CustomerStackRoutes.Notifications]: 'notifications',
          [CustomerStackRoutes.ProductDetail]: 'product/:id',
          [CustomerStackRoutes.VehicleDetail]: 'vehicle/:id',
          [CustomerStackRoutes.AiAssistant]: 'ai-assistant',
          [CustomerStackRoutes.ManualAddress]: 'address/manual',
          [CustomerStackRoutes.OtpVerification]: 'verify-mobile',
          [CustomerStackRoutes.OtpSuccess]: 'verify-mobile/success',
        },
      },
      [RootRoutes.Dealer]: {
        screens: {
          [DealerStackRoutes.DealerTabs]: {
            screens: {
              [DealerTabRoutes.Dashboard]: 'dealer/dashboard',
              [DealerTabRoutes.Inventory]: 'dealer/inventory',
              [DealerTabRoutes.Orders]: 'dealer/orders',
              [DealerTabRoutes.Drive]: 'dealer/drive',
              [DealerTabRoutes.Bank]: 'dealer/bank',
              [DealerTabRoutes.Profile]: 'dealer/profile',
            },
          },
          [DealerStackRoutes.DealerType]: 'dealer/type',
          [DealerStackRoutes.BusinessRegistration]: 'dealer/register',
          [DealerStackRoutes.ProductForm]: 'dealer/product-form',
          [DealerStackRoutes.VehicleForm]: 'dealer/vehicle-form',
          [DealerStackRoutes.ServiceForm]: 'dealer/service-form',
          [DealerStackRoutes.BusinessDetails]: 'dealer/business-details',
        },
      },
    },
  },
};
