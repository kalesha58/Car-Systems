import mongoose, { Document, Schema } from 'mongoose';

export type CustomerEnquiryStatus = 'new' | 'responded' | 'resolved';

export interface ICustomerEnquiryDocument extends Document {
  userId: string;
  dealerId: string;
  vehicleId?: string;
  message: string;
  status: CustomerEnquiryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const customerEnquirySchema = new Schema<ICustomerEnquiryDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    dealerId: {
      type: String,
      required: true,
      index: true,
    },
    vehicleId: {
      type: String,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'responded', 'resolved'],
      default: 'new',
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
customerEnquirySchema.index({ dealerId: 1, status: 1 });
customerEnquirySchema.index({ userId: 1 });
customerEnquirySchema.index({ createdAt: -1 });

export const CustomerEnquiry = mongoose.model<ICustomerEnquiryDocument>(
  'CustomerEnquiry',
  customerEnquirySchema,
);
