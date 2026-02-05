import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'user' | 'admin' | 'dealer';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface IPrivacySettings {
  isPrivate: boolean;
  hidePhone: boolean;
  hideEmail: boolean;
  hideVehicleNumber: boolean;
}

export interface ISignUpDocument extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole[];
  status: UserStatus;
  profileImage?: string;
  resetPasswordCode?: string;
  resetPasswordCodeExpires?: Date;
  googleId?: string;
  fcmToken?: string;
  privacySettings?: IPrivacySettings;
  createdAt?: Date;
  updatedAt?: Date;
}

const signUpSchema = new Schema<ISignUpDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: [String],
      enum: ['user', 'admin', 'dealer'],
      default: ['user'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    profileImage: {
      type: String,
      trim: true,
    },
    resetPasswordCode: {
      type: String,
      select: false,
    },
    resetPasswordCodeExpires: {
      type: Date,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    fcmToken: {
      type: String,
      trim: true,
      default: null,
    },
    privacySettings: {
      type: {
        isPrivate: { type: Boolean, default: false },
        hidePhone: { type: Boolean, default: false },
        hideEmail: { type: Boolean, default: false },
        hideVehicleNumber: { type: Boolean, default: false },
      },
      default: {
        isPrivate: false,
        hidePhone: false,
        hideEmail: false,
        hideVehicleNumber: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
signUpSchema.index({ email: 1 }, { unique: true });
signUpSchema.index({ phone: 1 }, { unique: true });
signUpSchema.index({ googleId: 1 }, { unique: true, sparse: true });
signUpSchema.index({ fcmToken: 1 }, { sparse: true });

// Hash password before saving
signUpSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(3);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});


export const SignUp = mongoose.model<ISignUpDocument>('Signup', signUpSchema);

