import mongoose, { Document, Schema } from 'mongoose';

export type DealerType =
  | 'Automobile Showroom'
  | 'Bike Dealer'
  | 'Vehicle Wash Station'
  | 'Detailing Center'
  | 'Mechanic Workshop'
  | 'Spare Parts Dealer'
  | 'Riding Gear Store';

export type BusinessRegistrationStatus = 'pending' | 'approved' | 'rejected';

export interface IPayoutCredentials {
  type: 'UPI' | 'BANK';
  upiId?: string;
  bank?: {
    accountNumber: string;
    ifsc: string;
    accountName: string;
  };
}

export interface IBusinessRegistrationDocument extends Document {
  businessName: string;
  type: DealerType;
  address: string;
  phone: string;
  gst?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  payout?: IPayoutCredentials;
  shopPhotos?: {
    url: string;
    publicId?: string;
  }[];
  documents?: {
    kind: 'GST' | 'LICENSE' | 'ID' | 'PAN';
    url: string;
    publicId?: string;
    mimeType?: string;
    originalName?: string;
  }[];
  status: BusinessRegistrationStatus;
  storeOpen: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define explicit schemas for nested subdocuments
const shopPhotoSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true },
  },
  { _id: false },
);

const documentSchema = new Schema(
  {
    kind: {
      type: String,
      required: true,
      enum: ['GST', 'LICENSE', 'ID', 'PAN'],
    },
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    originalName: { type: String, trim: true },
  },
  { _id: false },
);

const businessRegistrationSchema = new Schema<IBusinessRegistrationDocument>(
  {
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'Automobile Showroom',
        'Bike Dealer',
        'Vehicle Wash Station',
        'Detailing Center',
        'Mechanic Workshop',
        'Spare Parts Dealer',
        'Riding Gear Store',
      ],
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    gst: {
      type: String,
      trim: true,
    },
    payout: {
      type: {
        type: String,
        enum: ['UPI', 'BANK'],
      },
      upiId: {
        type: String,
        trim: true,
        match: [/^[\w.-]+@[\w]+$/, 'Invalid UPI ID format'],
      },
      bank: {
        accountNumber: { type: String, trim: true },
        ifsc: {
          type: String,
          trim: true,
          uppercase: true,
          match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'],
        },
        accountName: { type: String, trim: true },
      },
    },
    shopPhotos: {
      type: [shopPhotoSchema],
      default: [],
    },
    documents: {
      type: [documentSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    storeOpen: {
      type: Boolean,
      default: true,
    },
    userId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
businessRegistrationSchema.index({ userId: 1 }, { unique: true });
businessRegistrationSchema.index({ status: 1 });

export const BusinessRegistration = mongoose.model<IBusinessRegistrationDocument>(
  'BusinessRegistration',
  businessRegistrationSchema,
);

