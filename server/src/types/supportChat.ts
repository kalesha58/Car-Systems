export type ChatIntent =
  | 'ORDER_TRACKING'
  | 'ORDER_STATUS'
  | 'ORDER_CANCELLATION'
  | 'ORDER_RETURN'
  | 'ORDER_HISTORY'
  | 'PRODUCT_SEARCH'
  | 'PRODUCT_SPECS'
  | 'PRODUCT_AVAILABILITY'
  | 'PRODUCT_RECOMMENDATION'
  | 'PRODUCT_PRICE'
  | 'ACCOUNT_PROFILE'
  | 'ACCOUNT_SETTINGS'
  | 'PAYMENT_INFO'
  | 'CART_STATUS'
  | 'WISHLIST'
  | 'GENERAL_HELP'
  | 'DEALER_ORDERS'
  | 'DEALER_ORDER_UPDATE'
  | 'DEALER_PRODUCTS'
  | 'DEALER_INVENTORY'
  | 'DEALER_ANALYTICS'
  | 'DEALER_BUSINESS'
  | 'DEALER_EARNINGS'
  | 'UNKNOWN';

export interface IChatMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
  intent?: ChatIntent;
  metadata?: Record<string, any>;
}

export interface IChatIntent {
  intent: ChatIntent;
  confidence: number;
  entities: Record<string, any>;
}

export interface IQuickAction {
  id: string;
  label: string;
  actionType: 'TRACK_ORDER' | 'RETURN_REFUND' | 'PRODUCT_SEARCH' | 'ACCOUNT_HELP' | 'DEALER_ORDERS' | 'DEALER_PRODUCTS';
  icon?: string;
  metadata?: Record<string, any>;
}

export interface IChatResponse {
  text: string;
  intent?: ChatIntent;
  quickActions?: IQuickAction[];
  data?: Record<string, any>;
  navigation?: {
    screen: string;
    params?: Record<string, any>;
  };
}

export interface IUserContext {
  userId: string;
  role: string[];
  recentOrders?: any[];
  cartItems?: any[];
  wishlistItems?: string[];
  profile?: any;
}

export interface IProcessMessageRequest {
  message: string;
  sessionId?: string;
}

export interface IProcessMessageResponse {
  response: IChatResponse;
  sessionId: string;
}

export interface IQuickActionRequest {
  actionType: string;
  actionData?: Record<string, any>;
}

