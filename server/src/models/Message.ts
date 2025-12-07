import mongoose, { Document, Schema } from 'mongoose';

export type MessageType = 'text' | 'location' | 'liveLocation' | 'image';

export interface ILocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface IMessageDocument extends Document {
  chatId: string;
  from: string;
  to?: string;
  groupId?: string;
  text: string;
  messageType: MessageType;
  location?: ILocationData;
  isLiveLocation?: boolean;
  imageUrl?: string;
  imagePublicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const locationDataSchema = new Schema<ILocationData>(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
  },
  { _id: false },
);

const messageSchema = new Schema<IMessageDocument>(
  {
    chatId: {
      type: String,
      required: true,
    },
    from: {
      type: String,
      required: true,
    },
    to: {
      type: String,
    },
    groupId: {
      type: String,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'location', 'liveLocation', 'image'],
      default: 'text',
    },
    location: {
      type: locationDataSchema,
    },
    isLiveLocation: {
      type: Boolean,
      default: false,
    },
    imageUrl: {
      type: String,
    },
    imagePublicId: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ from: 1 });
messageSchema.index({ to: 1 });
messageSchema.index({ groupId: 1 });
messageSchema.index({ createdAt: -1 });

export const Message = mongoose.model<IMessageDocument>('Message', messageSchema);


