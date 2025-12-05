import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
  intent?: string;
  metadata?: Record<string, any>;
}

export interface ISupportChatDocument extends Document {
  userId: string;
  sessionId: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'bot'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    intent: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { _id: false },
);

const supportChatSchema = new Schema<ISupportChatDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    messages: {
      type: [chatMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for efficient queries
supportChatSchema.index({ userId: 1, sessionId: 1 });
supportChatSchema.index({ userId: 1, updatedAt: -1 });

export const SupportChat = mongoose.model<ISupportChatDocument>('SupportChat', supportChatSchema);

