import mongoose, { Schema, Model, HydratedDocument } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, ROLE_VALUES, Role } from '../../common/constants/roles.js';

const SALT_ROUNDS = 10;

export interface Address {
  street: string;
  district: string;
  city: string;
  state: string;
  zip: string;
  fullAddress: string;
}

export interface IUser {
  name: string;
  username: string;
  email: string;
  avatar?: string|null;
  password: string;
  address?: Address|null;
  phone: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

export type UserDocument = HydratedDocument<IUser, IUserMethods>;
type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    username: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true 
    },
    avatar: { 
        type: String, 
        required: false,
    },
    password: { 
        type: String, 
        required: true, 
        minlength: 6, 
        select: false 
    },
    role: { 
        type: String, 
        enum: ROLE_VALUES, 
        default: ROLES.USER 
    },
    phone: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true 
    },
    address: {
      type: Object,
      required: false,
      street: { type: String, 
        required: false, 
        trim: true },
      district: { type: String, 
        required: false, 
        trim: true },
      city: { type: String, 
        required: false, 
        trim: true },
      state: { type: String, 
        required: false, 
        trim: true },
      zip: { type: String, 
        required: false, 
        trim: true },
      fullAddress: { type: String, 
        required: false, 
        trim: true }, 
    }
  },
  { timestamps: true },
);

// Hash the password whenever it is set or changed.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

userSchema.method('comparePassword', function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
});

export const User = mongoose.model<IUser, UserModel>('User', userSchema);
export default User;
