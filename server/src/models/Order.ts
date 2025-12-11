import mongoose, { Document, Schema } from 'mongoose';

export type OrderStatus =
  | 'ORDER_PLACED'
  | 'PENDING_COD'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'ORDER_CONFIRMED'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED_BY_USER'
  | 'CANCELLED_BY_DEALER'
  | 'COD_NOT_COLLECTED'
  | 'RETURN_REQUESTED'
  | 'RETURN_PICKED'
  | 'REFUND_INITIATED'
  | 'REFUND_COMPLETED';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'upi' | 'cash_on_delivery';
export type TimelineActor = 'user' | 'dealer' | 'admin' | 'system';

export interface IOrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IAddress {
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

export interface ITracking {
  trackingNumber: string;
  carrier: string;
  status: string;
  estimatedDelivery?: Date;
}

export interface ITimelineEvent {
  status: OrderStatus;
  timestamp: Date;
  notes?: string;
  actor?: TimelineActor;
  actorId?: string;
  previousStatus?: OrderStatus;
}

export interface IOrderDocumentRef {
  documentType: 'invoice' | 'shipment_proof' | 'other';
  documentUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
}

export interface IReturnRequest {
  reason: string;
  images?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'picked' | 'completed';
  requestedAt: Date;
  processedAt?: Date;
  notes?: string;
}

export interface IOrderDocument extends Document {
  orderNumber: string;
  userId: string;
  dealerId?: string;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  codCharge: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentIntentId?: string;
  expiresAt?: Date;
  shippingAddress: IAddress;
  billingAddress: IAddress;
  tracking?: ITracking;
  timeline: ITimelineEvent[];
  cancellationReason?: string;
  documents?: IOrderDocumentRef[];
  returnRequest?: IReturnRequest;
  expectedDeliveryDate?: Date;
  deliveryLocation?: ILocation;
  pickupLocation?: ILocation;
  deliveryPersonLocation?: ILocation;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const addressSchema = new Schema<IAddress>(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false },
);

const trackingSchema = new Schema<ITracking>(
  {
    trackingNumber: { type: String, required: true },
    carrier: { type: String, required: true },
    status: { type: String, required: true },
    estimatedDelivery: { type: Date },
  },
  { _id: false },
);

const timelineEventSchema = new Schema<ITimelineEvent>(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    notes: { type: String },
    actor: { type: String, enum: ['user', 'dealer', 'admin', 'system'] },
    actorId: { type: String },
    previousStatus: { type: String },
  },
  { _id: false },
);

const orderDocumentRefSchema = new Schema<IOrderDocumentRef>(
  {
    documentType: {
      type: String,
      enum: ['invoice', 'shipment_proof', 'other'],
      required: true,
    },
    documentUrl: { type: String, required: true },
    uploadedBy: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    description: { type: String },
  },
  { _id: false },
);

const returnRequestSchema = new Schema<IReturnRequest>(
  {
    reason: { type: String, required: true },
    images: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'picked', 'completed'],
      default: 'pending',
    },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
    notes: { type: String },
  },
  { _id: false },
);

const locationSchema = new Schema<ILocation>(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
    },
    dealerId: {
      type: String,
    },
    items: {
      type: [orderItemSchema],
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    shipping: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    codCharge: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentIntentId: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: [
        'ORDER_PLACED',
        'PENDING_COD',
        'PENDING_PAYMENT',
        'PAYMENT_CONFIRMED',
        'PAYMENT_FAILED',
        'ORDER_CONFIRMED',
        'PACKED',
        'SHIPPED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED_BY_USER',
        'CANCELLED_BY_DEALER',
        'COD_NOT_COLLECTED',
        'RETURN_REQUESTED',
        'RETURN_PICKED',
        'REFUND_INITIATED',
        'REFUND_COMPLETED',
      ],
      default: 'ORDER_PLACED',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'upi', 'cash_on_delivery'],
      required: true,
    },
    shippingAddress: {
      type: addressSchema,
      required: true,
    },
    billingAddress: {
      type: addressSchema,
      required: true,
    },
    tracking: {
      type: trackingSchema,
    },
    timeline: {
      type: [timelineEventSchema],
      default: [],
    },
    cancellationReason: {
      type: String,
    },
    documents: {
      type: [orderDocumentRefSchema],
      default: [],
    },
    returnRequest: {
      type: returnRequestSchema,
    },
    expectedDeliveryDate: {
      type: Date,
    },
    deliveryLocation: {
      type: locationSchema,
    },
    pickupLocation: {
      type: locationSchema,
    },
    deliveryPersonLocation: {
      type: locationSchema,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
orderSchema.index({ userId: 1 });
orderSchema.index({ dealerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ paymentIntentId: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrderDocument>('Order', orderSchema);

