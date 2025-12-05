import mongoose, { Document, Schema } from 'mongoose';

export type OrderDocumentType = 'invoice' | 'shipment_proof' | 'other';

export interface IOrderDocumentDocument extends Document {
  orderId: string;
  documentType: OrderDocumentType;
  documentUrl: string;
  uploadedBy: string;
  uploadedByRole: 'user' | 'dealer' | 'admin';
  uploadedAt: Date;
  description?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderDocumentSchema = new Schema<IOrderDocumentDocument>(
  {
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ['invoice', 'shipment_proof', 'other'],
      required: true,
    },
    documentUrl: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: String,
      required: true,
      index: true,
    },
    uploadedByRole: {
      type: String,
      enum: ['user', 'dealer', 'admin'],
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    mimeType: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
orderDocumentSchema.index({ orderId: 1, documentType: 1 });
orderDocumentSchema.index({ uploadedBy: 1 });

export const OrderDocument = mongoose.model<IOrderDocumentDocument>(
  'OrderDocument',
  orderDocumentSchema,
);

