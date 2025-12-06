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

export interface IOrderResponse {
  success: boolean;
  data: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    paymentStatus: string;
    status: string;
  };
}

