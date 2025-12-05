import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  IOrderItem,
  IAddress,
  ITracking,
  ITimelineEvent,
} from '../../models/Order';

export interface IDealerOrder {
  id: string;
  orderNumber: string;
  userId: string;
  dealerId?: string;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  shippingAddress: IAddress;
  billingAddress: IAddress;
  tracking?: ITracking;
  timeline: ITimelineEvent[];
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IGetDealerOrdersRequest {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IUpdateOrderStatusRequest {
  status: OrderStatus;
  notes?: string;
}

export interface ICancelOrderRequest {
  reason: string;
}

export interface IAddTrackingRequest {
  trackingNumber: string;
  carrier: string;
  status: string;
  estimatedDelivery?: string;
}

export interface IAssignDealerRequest {
  dealerId: string;
}

export interface IRefundOrderRequest {
  reason?: string;
}

export interface IOrderStats {
  total: number;
  ORDER_PLACED?: number;
  PAYMENT_CONFIRMED?: number;
  ORDER_CONFIRMED?: number;
  PACKED?: number;
  SHIPPED?: number;
  OUT_FOR_DELIVERY?: number;
  DELIVERED?: number;
  CANCELLED_BY_USER?: number;
  CANCELLED_BY_DEALER?: number;
  RETURN_REQUESTED?: number;
  RETURN_PICKED?: number;
  REFUND_INITIATED?: number;
  REFUND_COMPLETED?: number;
  totalRevenue: number;
}



