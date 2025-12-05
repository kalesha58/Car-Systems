import mongoose, { Document, Schema } from 'mongoose';

export type ChatType = 'direct' | 'group';

export interface IChatDocument extends Document {
  type: ChatType;
  participants: string[];
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChatDocument>(
  {
    type: {
      type: String,
      enum: ['direct', 'group'],
      required: true,
    },
    participants: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v.length >= 2;
        },
        message: 'Chat must have at least 2 participants',
      },
    },
    groupId: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

chatSchema.index({ type: 1 });
chatSchema.index({ groupId: 1 });
chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });

export const Chat = mongoose.model<IChatDocument>('Chat', chatSchema);


