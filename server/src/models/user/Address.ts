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
  locationDescription?: string; // For "other" address type (e.g., "uncle's house")
  nearbyLocation?: string; // Nearby landmark or location
  alternateNumber?: string; // Alternate contact number
  flatNumber?: string; // Flat/Apartment number
  buildingName?: string; // Building name
  townOrCity?: string; // Town or city name
  pincode?: string; // Pincode/Postal code
  state?: string; // State
  isDefault?: boolean; // Mark address as default
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
    locationDescription: {
      type: String,
      trim: true,
    },
    nearbyLocation: {
      type: String,
      trim: true,
    },
    alternateNumber: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Alternate number must be exactly 10 digits'],
    },
    flatNumber: {
      type: String,
      trim: true,
    },
    buildingName: {
      type: String,
      trim: true,
    },
    townOrCity: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
addressSchema.index({ userId: 1 });
addressSchema.index({ userId: 1, createdAt: -1 });
addressSchema.index({ userId: 1, isDefault: 1 });

export const Address = mongoose.model<IAddressDocument>('Address', addressSchema);

