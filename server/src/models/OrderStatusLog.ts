import mongoose, { Document, Schema } from 'mongoose';
import { OrderStatus, TimelineActor } from './Order';

export interface IOrderStatusLogDocument extends Document {
  orderId: string;
  previousStatus?: OrderStatus;
  newStatus: OrderStatus;
  actor: TimelineActor;
  actorId: string;
  timestamp: Date;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const orderStatusLogSchema = new Schema<IOrderStatusLogDocument>(
  {
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    previousStatus: {
      type: String,
    },
    newStatus: {
      type: String,
      required: true,
    },
    actor: {
      type: String,
      enum: ['user', 'dealer', 'admin', 'system'],
      required: true,
    },
    actorId: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
orderStatusLogSchema.index({ orderId: 1, timestamp: -1 });
orderStatusLogSchema.index({ actorId: 1 });
orderStatusLogSchema.index({ newStatus: 1 });

export const OrderStatusLog = mongoose.model<IOrderStatusLogDocument>(
  'OrderStatusLog',
  orderStatusLogSchema,
);

