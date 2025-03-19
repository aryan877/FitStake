import bcrypt from "bcryptjs";
import mongoose, { Document, Schema } from "mongoose";
import { User } from "../types";

interface UserDocument extends Omit<User, "id">, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  walletAddress: {
    type: String,
    unique: true,
    sparse: true,
  },
  fitnessIntegrations: {
    googleFit: {
      connected: { type: Boolean, default: false },
      accessToken: String,
      refreshToken: String,
    },
    appleHealth: {
      connected: { type: Boolean, default: false },
      userId: String,
    },
    fitbit: {
      connected: { type: Boolean, default: false },
      accessToken: String,
      refreshToken: String,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const UserModel = mongoose.model<UserDocument>("User", userSchema);
