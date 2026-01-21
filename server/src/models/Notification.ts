import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'order_update' | 'service_update' | 'general';

export interface INotificationDocument extends Document {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    orderId?: string;
    serviceId?: string;
    status?: string;
    [key: string]: any;
  };
  read: boolean;
  readAt?: Date;
  relatedId?: string; // orderId or serviceId
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['order_update', 'service_update', 'general'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    relatedId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotificationDocument>('Notification', notificationSchema);
