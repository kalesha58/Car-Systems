import mongoose, { Document, Schema } from 'mongoose';

export interface ISettingsDocument extends Document {
  siteName: string;
  siteEmail: string;
  currency: string;
  taxRate: number;
  shippingCost: number;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettingsDocument>(
  {
    siteName: {
      type: String,
      required: true,
      default: 'Car Connect',
    },
    siteEmail: {
      type: String,
      required: true,
      default: 'admin@carconnect.com',
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    taxRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    shippingCost: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  },
);

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export const Settings = mongoose.model<ISettingsDocument>('Settings', settingsSchema);

