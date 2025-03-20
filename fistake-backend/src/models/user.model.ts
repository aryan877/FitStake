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
  username: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<UserDocument>("User", userSchema);
