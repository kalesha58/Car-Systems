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

export interface ICreateOrderRequest {
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  paymentMethod: 'credit_card' | 'debit_card' | 'upi' | 'cash_on_delivery';
  dealerId?: string;
}

export interface ILocation {
  latitude: number;
  longitude: number;
  address?: string;
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
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress: IShippingAddress;
  billingAddress: IShippingAddress;
  tracking?: any;
  timeline: any[];
  cancellationReason?: string;
  documents?: any[];
  returnRequest?: any;
  expectedDeliveryDate?: string;
  deliveryLocation?: ILocation;
  pickupLocation?: ILocation;
  deliveryPersonLocation?: ILocation;
  createdAt: string;
  updatedAt: string;
  deliveryPartner?: {
    _id: string;
    name: string;
    phone: string;
  };
  customer?: {
    name: string;
    phone: string;
    address: string;
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

