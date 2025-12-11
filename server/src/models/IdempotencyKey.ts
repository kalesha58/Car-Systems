import mongoose, { Document, Schema } from 'mongoose';

export interface IIdempotencyKeyDocument extends Document {
  key: string;
  userId: string;
  requestHash: string;
  responsePayload: any;
  expiresAt: Date;
  createdAt: Date;
}

const idempotencyKeySchema = new Schema<IIdempotencyKeyDocument>(
  {
    key: {
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
    requestHash: {
      type: String,
      required: true,
    },
    responsePayload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
idempotencyKeySchema.index({ key: 1 }, { unique: true });
idempotencyKeySchema.index({ userId: 1 });
idempotencyKeySchema.index({ expiresAt: 1 });

export const IdempotencyKey = mongoose.model<IIdempotencyKeyDocument>(
  'IdempotencyKey',
  idempotencyKeySchema,
);

