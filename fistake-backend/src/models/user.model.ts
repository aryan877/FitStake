import mongoose, { Document, Schema } from "mongoose";
import { User, UserBadge, UserStats } from "../types";

interface UserDocument extends User, Document {}

const userStatsSchema = new Schema<UserStats>({
  totalStepCount: {
    type: Number,
    default: 0,
  },
  challengesCompleted: {
    type: Number,
    default: 0,
  },
  challengesJoined: {
    type: Number,
    default: 0,
  },
  challengesCreated: {
    type: Number,
    default: 0,
  },
  totalStaked: {
    type: Number,
    default: 0,
  },
  totalEarned: {
    type: Number,
    default: 0,
  },
  winRate: {
    type: Number,
    default: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const userBadgeSchema = new Schema<UserBadge>({
  badgeId: {
    type: String,
    required: true,
  },
  earnedAt: {
    type: Date,
    default: Date.now,
  },
});

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
  isAdmin: {
    type: Boolean,
    default: false,
  },
  stats: {
    type: userStatsSchema,
    default: () => ({}),
  },
  badges: {
    type: [userBadgeSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<UserDocument>("User", userSchema);
