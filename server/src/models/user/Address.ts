import mongoose, { Document, Schema } from 'mongoose';

export interface IAddressCoordinates {
  latitude: number;
  longitude: number;
}

export interface IAddressDocumentFields {
  userId: string;
  name: string;
  phone: string;
  fullAddress: string;
  coordinates: IAddressCoordinates;
  addressType: 'home' | 'office' | 'other';
  iconType: 'home' | 'building' | 'location';
  createdAt: Date;
  updatedAt: Date;
}

export type IAddressDocument = Document & IAddressDocumentFields;

const coordinatesSchema = new Schema<IAddressCoordinates>(
  {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
  },
  { _id: false },
);

const addressSchema = new Schema<any>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'],
    },
    fullAddress: {
      type: String,
      required: true,
      trim: true,
    },
    coordinates: {
      type: coordinatesSchema,
      required: true,
    },
    addressType: {
      type: String,
      enum: ['home', 'office', 'other'],
      required: true,
      default: 'home',
    },
    iconType: {
      type: String,
      enum: ['home', 'building', 'location'],
      required: true,
      default: 'location',
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
addressSchema.index({ userId: 1 });
addressSchema.index({ userId: 1, createdAt: -1 });

export const Address = mongoose.model<IAddressDocument>('Address', addressSchema);

