import mongoose, { Document, Schema } from 'mongoose';

export type StoryMediaType = 'image' | 'video';

export interface IStoryItemDocument {
  order: number;
  type: StoryMediaType;
  mediaUrl: string;
  caption?: string;
  sourcePostId?: string;
  createdAt: Date;
}

export interface IStoryDocument extends Document {
  userId: string;
  items: IStoryItemDocument[];
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const storyItemSchema = new Schema<IStoryItemDocument>(
  {
    order: { type: Number, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    mediaUrl: { type: String, required: true },
    caption: { type: String, trim: true, maxlength: 500 },
    sourcePostId: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const storySchema = new Schema<IStoryDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    items: {
      type: [storyItemSchema],
      default: [],
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

storySchema.index({ userId: 1, expiresAt: 1 });
storySchema.index({ expiresAt: 1 });

export const Story = mongoose.model<IStoryDocument>('Story', storySchema);
