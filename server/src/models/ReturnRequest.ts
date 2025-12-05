import mongoose, { Document, Schema } from 'mongoose';

export type ReturnRequestStatus = 'pending' | 'approved' | 'rejected' | 'picked' | 'completed';

export interface IReturnRequestDocument extends Document {
  orderId: string;
  userId: string;
  dealerId?: string;
  reason: string;
  images?: string[];
  status: ReturnRequestStatus;
  requestedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectedReason?: string;
  pickedAt?: Date;
  completedAt?: Date;
  refundAmount?: number;
  refundStatus?: 'pending' | 'initiated' | 'completed' | 'failed';
  refundTransactionId?: string;
  notes?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const returnRequestSchema = new Schema<IReturnRequestDocument>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    dealerId: {
      type: String,
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'picked', 'completed'],
      default: 'pending',
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    rejectedReason: {
      type: String,
    },
    pickedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    refundAmount: {
      type: Number,
      min: 0,
    },
    refundStatus: {
      type: String,
      enum: ['pending', 'initiated', 'completed', 'failed'],
    },
    refundTransactionId: {
      type: String,
    },
    notes: {
      type: String,
    },
    adminNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
returnRequestSchema.index({ userId: 1, status: 1 });
returnRequestSchema.index({ dealerId: 1, status: 1 });
returnRequestSchema.index({ status: 1, requestedAt: -1 });

export const ReturnRequest = mongoose.model<IReturnRequestDocument>(
  'ReturnRequest',
  returnRequestSchema,
);

