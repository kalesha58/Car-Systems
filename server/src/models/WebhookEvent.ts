import mongoose, { Document, Schema } from 'mongoose';

export interface IWebhookEventDocument extends Document {
  gatewayEventId: string;
  payload: any;
  signature?: string;
  verified: boolean;
  processed: boolean;
  processedAt?: Date;
  error?: string;
  createdAt: Date;
}

const webhookEventSchema = new Schema<IWebhookEventDocument>(
  {
    gatewayEventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    signature: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    processed: {
      type: Boolean,
      default: false,
    },
    processedAt: {
      type: Date,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
webhookEventSchema.index({ gatewayEventId: 1 }, { unique: true });
webhookEventSchema.index({ processed: 1 });
webhookEventSchema.index({ verified: 1 });
webhookEventSchema.index({ createdAt: -1 });

export const WebhookEvent = mongoose.model<IWebhookEventDocument>(
  'WebhookEvent',
  webhookEventSchema,
);




