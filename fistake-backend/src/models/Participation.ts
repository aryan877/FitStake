import mongoose, { Schema } from "mongoose";
import { Participation } from "../types";

const participationSchema = new Schema<Participation>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  challengeId: {
    type: Schema.Types.ObjectId,
    ref: "Challenge",
    required: true,
  },
  stakeTxId: {
    type: String,
    required: true,
  },
  dailyProgress: [
    {
      date: {
        type: Date,
        required: true,
      },
      value: {
        type: Number,
        required: true,
      },
      verified: {
        type: Boolean,
        default: false,
      },
      verificationSource: {
        type: String,
        required: true,
      },
    },
  ],
  status: {
    type: String,
    enum: ["active", "completed", "failed"],
    default: "active",
  },
  completionPercentage: {
    type: Number,
    default: 0,
  },
  reward: {
    amount: Number,
    txId: String,
    claimedAt: Date,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure a user can only join a challenge once
participationSchema.index({ userId: 1, challengeId: 1 }, { unique: true });

export const ParticipationModel = mongoose.model<Participation>(
  "Participation",
  participationSchema
);
