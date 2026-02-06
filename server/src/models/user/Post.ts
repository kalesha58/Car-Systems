import mongoose, { Document, Schema } from 'mongoose';

export interface ILocationDocument {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface ICommentDocument {
  id: string;
  postId: string;
  userId: string;
  text: string;
  parentCommentId?: string; // For nested replies
  likes: number;
  likedBy: string[]; // Array of user IDs who liked this comment
  createdAt: Date;
}

export interface IPostDocument extends Document {
  userId: string;
  text: string;
  images?: string[];
  video?: string;
  location?: ILocationDocument;
  likes: number;
  likedBy: string[]; // Array of user IDs who liked this post
  comments?: ICommentDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<ILocationDocument>(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
  },
  { _id: false },
);

const commentSchema = new Schema<ICommentDocument>(
  {
    id: { type: String, required: true },
    postId: { type: String, required: true },
    userId: { type: String, required: true },
    text: { type: String, required: true },
    parentCommentId: { type: String },
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const postSchema = new Schema<IPostDocument>(
  {
    userId: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    video: {
      type: String,
    },
    location: {
      type: locationSchema,
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: {
      type: [String],
      default: [],
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

postSchema.index({ userId: 1 });
postSchema.index({ createdAt: -1 });

export const Post = mongoose.model<IPostDocument>('Post', postSchema);

