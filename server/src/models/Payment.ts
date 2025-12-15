import mongoose, { Document, Schema } from 'mongoose';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IPaymentDocument extends Document {
  orderId: string;
  gatewayTxnId?: string;
  gatewayPaymentIntentId?: string;
  amount: number; // in paise
  currency: string;
  status: PaymentStatus;
  rawPayload?: any;
  payoutId?: string;
  payoutStatus?: PayoutStatus;
  refundId?: string;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPaymentDocument>(
  {
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    gatewayTxnId: {
      type: String,
      index: true,
      sparse: true,
    },
    gatewayPaymentIntentId: {
      type: String,
      index: true,
      sparse: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    rawPayload: {
      type: Schema.Types.Mixed,
    },
    payoutId: {
      type: String,
    },
    payoutStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
    },
    refundId: {
      type: String,
    },
    refundAmount: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ gatewayTxnId: 1 });
paymentSchema.index({ gatewayPaymentIntentId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ payoutStatus: 1 });
paymentSchema.index({ createdAt: -1 });

export const Payment = mongoose.model<IPaymentDocument>('Payment', paymentSchema);




