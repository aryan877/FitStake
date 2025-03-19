import mongoose, { Document, Schema } from "mongoose";

export interface Challenge extends Document {
  title: string;
  description: string;
  type: "STEPS" | "WORKOUT" | "SLEEP" | "CUSTOM";
  goal: {
    value: number;
    unit: string;
  };
  duration: {
    days: number;
    startDate?: Date;
    endDate?: Date;
  };
  stake: {
    amount: number;
    token: string;
  };
  participants: {
    did: string;
    status: "ACTIVE" | "COMPLETED" | "FAILED";
    joinedAt: Date;
  }[];
  isActive: boolean;
  createdBy: string; // User DID
  poolAmount: number;
  completedCount: number;
  totalParticipants: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["STEPS", "WORKOUT", "SLEEP", "CUSTOM"],
      required: true,
    },
    goal: {
      value: {
        type: Number,
        required: true,
      },
      unit: {
        type: String,
        required: true,
      },
    },
    duration: {
      days: {
        type: Number,
        required: true,
      },
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
    },
    stake: {
      amount: {
        type: Number,
        required: true,
      },
      token: {
        type: String,
        required: true,
        default: "SOL",
      },
    },
    participants: [
      {
        did: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ["ACTIVE", "COMPLETED", "FAILED"],
          default: "ACTIVE",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    poolAmount: {
      type: Number,
      default: 0,
    },
    completedCount: {
      type: Number,
      default: 0,
    },
    totalParticipants: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual for calculating success rate
ChallengeSchema.virtual("successRate").get(function (this: Challenge) {
  if (this.totalParticipants === 0) return 0;
  return (this.completedCount / this.totalParticipants) * 100;
});

// Pre-save hook to update the total participants count
ChallengeSchema.pre("save", function (this: Challenge, next) {
  this.totalParticipants = this.participants.length;
  next();
});

// Index for efficient queries
ChallengeSchema.index({ isActive: 1 });
ChallengeSchema.index({ "participants.did": 1 });
ChallengeSchema.index({ createdBy: 1 });

export default mongoose.model<Challenge>("Challenge", ChallengeSchema);
