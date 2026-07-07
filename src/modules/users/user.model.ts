import mongoose, { Schema, Model, HydratedDocument } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, ROLE_VALUES, Role } from '../../common/constants/roles.js';

const SALT_ROUNDS = 10;

export interface IUser {
  name: string;
  username: string;
  email: string;
  avatar?: string;
  password: string;
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
        required: false 
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
