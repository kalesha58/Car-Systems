import mongoose, { Document, Schema } from 'mongoose';

export interface IOtpSessionDocument extends Document {
  phone: string;
  requestId: string;
  expiresAt: Date;
  failedAttempts: number;
  sendCount: number;
  windowStartedAt: Date;
  lastSentAt: Date;
  verifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const otpSessionSchema = new Schema<IOtpSessionDocument>(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10}$/, 'Phone must be exactly 10 digits'],
    },
    requestId: {
      type: String,
      required: true,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    failedAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    sendCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    windowStartedAt: {
      type: Date,
      required: true,
    },
    lastSentAt: {
      type: Date,
      required: true,
    },
    verifiedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

otpSessionSchema.index({ phone: 1 }, { unique: true });
otpSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpSession = mongoose.model<IOtpSessionDocument>('OtpSession', otpSessionSchema);
