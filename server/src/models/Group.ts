import mongoose, { Document, Schema } from 'mongoose';

export type GroupType = 'bikeCarDrive' | 'vanTransportation';
export type GroupPrivacy = 'public' | 'private';

export interface IVanDetails {
  vanNumber: string;
  license: string;
  vehicleType: string;
}

export interface ILocationPoint {
  address: string;
  latitude: number;
  longitude: number;
}

export interface ITripPlan {
  plan: string;
  startDate: Date;
  endDate: Date;
  startTime?: string;
  endTime?: string;
  startingPoint?: ILocationPoint;
  endingPoint?: ILocationPoint;
}

export interface IGroupDocument extends Document {
  name: string;
  description?: string;
  theme?: string;
  type: GroupType;
  ownerId: string;
  privacy: GroupPrivacy;
  joinCode?: string;
  tripPlan?: ITripPlan;
  vanDetails?: IVanDetails;
  groupImage?: string;
  chatEnabled: boolean;
  liveLocationEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const vanDetailsSchema = new Schema<IVanDetails>(
  {
    vanNumber: { type: String, required: true, trim: true },
    license: { type: String, required: true, trim: true },
    vehicleType: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const locationPointSchema = new Schema<ILocationPoint>(
  {
    address: { type: String, required: true, trim: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false },
);

const tripPlanSchema = new Schema<ITripPlan>(
  {
    plan: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: { type: String },
    endTime: { type: String },
    startingPoint: { type: locationPointSchema },
    endingPoint: { type: locationPointSchema },
  },
  { _id: false },
);

const groupSchema = new Schema<IGroupDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    theme: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['bikeCarDrive', 'vanTransportation'],
      required: true,
    },
    ownerId: {
      type: String,
      required: true,
    },
    privacy: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    joinCode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    tripPlan: {
      type: tripPlanSchema,
    },
    vanDetails: {
      type: vanDetailsSchema,
    },
    groupImage: {
      type: String,
      trim: true,
    },
    chatEnabled: {
      type: Boolean,
      default: true,
    },
    liveLocationEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

groupSchema.index({ ownerId: 1 });
groupSchema.index({ joinCode: 1 });
groupSchema.index({ type: 1 });
groupSchema.index({ privacy: 1 });
groupSchema.index({ createdAt: -1 });

export const Group = mongoose.model<IGroupDocument>('Group', groupSchema);


