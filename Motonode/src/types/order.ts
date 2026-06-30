export interface IOrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ILocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface ICreateOrderRequest {
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  paymentMethod: 'credit_card' | 'debit_card' | 'upi' | 'cash_on_delivery';
  dealerId?: string;
  deliveryLocation?: ILocation;
  deliveryInstructions?: string;
  deliveryPreference?: {
    leaveAtDoor?: boolean;
    preferredTime?: 'morning' | 'afternoon' | 'evening';
    contactBeforeDelivery?: boolean;
  };
}

export interface IPaymentAction {
  type: 'RAZORPAY_CHECKOUT' | 'UPI_INTENT' | 'DEEP_LINK' | 'QR';
  paymentIntentId: string;
  keyId?: string;
  amount: number;
  currency: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  deeplink?: string;
  qrCode?: string;
  expiresAt?: string;
  image?: string;
}

export interface IOrderData {
  id: string;
  orderNumber: string;
  userId: string;
  dealerId?: string;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  totalAmount: number;
  codCharge?: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentAction?: IPaymentAction;
  shippingAddress: IShippingAddress;
  billingAddress: IShippingAddress;
  tracking?: unknown;
  timeline: unknown[];
  cancellationReason?: string;
  expectedDeliveryDate?: string;
  deliveryLocation?: ILocation;
  createdAt: string;
  updatedAt: string;
  dealer?: {
    id: string;
    name: string;
    businessName: string;
    phone: string;
    address?: string;
  };
  customer?: {
    name: string;
    phone: string;
    address?: string;
  };
}

export interface IOrderResponse {
  success: boolean;
  data: IOrderData;
}

export interface IOrdersListResponse {
  success: boolean;
  data: IOrderData[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IDealerOrderStats {
  total: number;
  pending?: number;
  confirmed?: number;
  processing?: number;
  shipped?: number;
  delivered?: number;
  cancelled?: number;
  totalRevenue: number;
}
