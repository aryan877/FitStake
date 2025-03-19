import mongoose, { Document, Schema } from "mongoose";
import { User } from "../types";

interface UserDocument extends User, Document {}

const userSchema = new Schema<UserDocument>({
  privyId: {
    type: String,
    required: true,
    unique: true,
  },
  walletAddress: {
    type: String,
    required: true,
    unique: true,
  },
  fitnessIntegrations: {
    googleFit: {
      connected: { type: Boolean, default: false },
      accessToken: { type: String },
      refreshToken: { type: String },
    },
    appleHealth: {
      connected: { type: Boolean, default: false },
      userId: { type: String },
    },
    fitbit: {
      connected: { type: Boolean, default: false },
      accessToken: { type: String },
      refreshToken: { type: String },
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<UserDocument>("User", userSchema);
