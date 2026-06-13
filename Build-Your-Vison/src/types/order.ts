export enum OrderUpdateStatus {
  ORDER_PLACED = 'ORDER_PLACED',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  PACKED = 'PACKED',
  SHIPPED = 'SHIPPED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED_BY_USER = 'CANCELLED_BY_USER',
  CANCELLED_BY_DEALER = 'CANCELLED_BY_DEALER',
  RETURN_REQUESTED = 'RETURN_REQUESTED',
  RETURN_PICKED = 'RETURN_PICKED',
  REFUND_INITIATED = 'REFUND_INITIATED',
  REFUND_COMPLETED = 'REFUND_COMPLETED',
}

export interface IOrderListItem {
  id: string;
  userId: string;
  userName: string;
  dealerId: string;
  dealerName: string;
  amount: number;
  status: OrderUpdateStatus | string;
  date: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  paymentMethod: string;
  paymentStatus: string;
}

export interface IOrderDetails extends IOrderListItem {
  orderNumber?: string;
  userEmail: string;
  userPhone: string;
  dealerEmail: string;
  dealerPhone: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  paymentDate?: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  tracking: Array<{
    status: string;
    date: string;
    description: string;
    actor?: string;
    actorId?: string;
    previousStatus?: string;
  }>;
}

