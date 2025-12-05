import mongoose, { Document, Schema } from 'mongoose';

export interface ILocationCoordinates {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface IScheduledTime {
  startTime: string;
  endTime: string;
  days?: string[];
}

export interface ILiveLocationDocument extends Document {
  userId: string;
  groupId: string;
  coordinates: ILocationCoordinates;
  isActive: boolean;
  scheduledTimes?: IScheduledTime;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const locationCoordinatesSchema = new Schema<ILocationCoordinates>(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
  },
  { _id: false },
);

const scheduledTimeSchema = new Schema<IScheduledTime>(
  {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    days: { type: [String] },
  },
  { _id: false },
);

const liveLocationSchema = new Schema<ILiveLocationDocument>(
  {
    userId: {
      type: String,
      required: true,
    },
    groupId: {
      type: String,
      required: true,
    },
    coordinates: {
      type: locationCoordinatesSchema,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    scheduledTimes: {
      type: scheduledTimeSchema,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

liveLocationSchema.index({ userId: 1, groupId: 1 }, { unique: true });
liveLocationSchema.index({ groupId: 1, isActive: 1 });
liveLocationSchema.index({ userId: 1 });
liveLocationSchema.index({ lastUpdated: -1 });

export const LiveLocation = mongoose.model<ILiveLocationDocument>(
  'LiveLocation',
  liveLocationSchema,
);


