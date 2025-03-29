import mongoose, { Document, Schema } from "mongoose";

export interface Challenge extends Document {
  challengeId: string;
  solanaChallengePda: string;
  solanaVaultPda: string;
  authority: string;
  admin: string;

  // Challenge details
  title: string;
  description: string;
  type: "STEPS";
  goal: {
    value: number;
    unit: string;
  };

  // Time periods
  startTime: number;
  endTime: number;

  // Stake details
  stakeAmount: number;
  minParticipants: number;
  maxParticipants: number;
  participantCount: number;
  totalStake: number;
  token: string;

  // Status flags
  isActive: boolean;
  isCompleted: boolean;
  onChainVerificationComplete: boolean;
  isPublic: boolean;

  // Participants
  participants: {
    walletAddress: string;
    did?: string;
    stakeAmount: number;
    completed: boolean;
    claimed: boolean;
    joinedAt: Date;
    healthData?: {
      date: string;
      steps: number;
      lastUpdated: Date;
    }[];
    progress?: number;
  }[];

  // Transaction tracking
  lastIndexedTransaction: string;
  lastEventTimestamp: Date;

  // Used for UI
  successRate?: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema: Schema = new Schema(
  {
    // Contract data
    challengeId: {
      type: String,
      required: true,
    },
    solanaChallengePda: {
      type: String,
      required: true,
    },
    solanaVaultPda: {
      type: String,
      required: true,
    },
    authority: {
      type: String,
      required: true,
    },
    admin: {
      type: String,
      required: true,
    },

    // Challenge details
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    description: {
      type: String,
      required: true,
      maxlength: 250,
    },
    type: {
      type: String,
      enum: ["STEPS"],
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

    // Time periods
    startTime: {
      type: Number,
      required: true,
    },
    endTime: {
      type: Number,
      required: true,
    },

    // Stake details
    stakeAmount: {
      type: Number,
      required: true,
    },
    minParticipants: {
      type: Number,
      required: true,
    },
    maxParticipants: {
      type: Number,
      required: true,
    },
    participantCount: {
      type: Number,
      default: 0,
    },
    totalStake: {
      type: Number,
      default: 0,
    },
    token: {
      type: String,
      required: true,
    },

    // Status flags
    isActive: {
      type: Boolean,
      default: false,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    onChainVerificationComplete: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },

    // Participants
    participants: [
      {
        walletAddress: {
          type: String,
          required: true,
        },
        did: {
          type: String,
        },
        stakeAmount: {
          type: Number,
          required: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        claimed: {
          type: Boolean,
          default: false,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        healthData: [
          {
            date: {
              type: String,
              required: true,
            },
            steps: {
              type: Number,
              required: true,
            },
            lastUpdated: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        progress: {
          type: Number,
          default: 0,
        },
      },
    ],

    // Transaction tracking
    lastIndexedTransaction: {
      type: String,
    },
    lastEventTimestamp: {
      type: Date,
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

// Calculate success rate
ChallengeSchema.virtual("successRate").get(function (this: Challenge) {
  const completedParticipants = this.participants.filter(
    (p) => p.completed
  ).length;
  return this.participantCount === 0
    ? 0
    : (completedParticipants / this.participantCount) * 100;
});

// Indexes for efficient queries
ChallengeSchema.index({ challengeId: 1 }, { unique: true });
ChallengeSchema.index({ solanaChallengePda: 1 }, { unique: true });
ChallengeSchema.index({ "participants.walletAddress": 1 });
ChallengeSchema.index({ isCompleted: 1, startTime: 1 });
ChallengeSchema.index({ authority: 1 });
ChallengeSchema.index({ isCompleted: 1, createdAt: -1, type: 1 });

// Text search index
ChallengeSchema.index(
  {
    challengeId: "text",
    title: "text",
    description: "text",
  },
  {
    weights: {
      challengeId: 10,
      title: 5,
      description: 1,
    },
    name: "search_index",
  }
);

export default mongoose.model<Challenge>("Challenge", ChallengeSchema);
