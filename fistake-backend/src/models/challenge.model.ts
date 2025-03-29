import mongoose, { Document, Schema } from "mongoose";

export interface Challenge extends Document {
  challengeId: string; // Unique ID from smart contract
  solanaChallengePda: string; // Challenge PDA on Solana
  solanaVaultPda: string; // Vault PDA that holds staked tokens
  authority: string; // Challenge creator's wallet address
  admin: string; // Admin address with special privileges

  // Challenge details
  title: string;
  description: string;
  type: "STEPS";
  goal: {
    value: number;
    unit: string;
  };

  // Time periods
  startTime: number; // Unix timestamp from smart contract
  endTime: number; // Unix timestamp from smart contract

  // Stake details (from smart contract)
  stakeAmount: number; // Amount in lamports
  minParticipants: number;
  maxParticipants: number;
  participantCount: number;
  totalStake: number; // Total tokens staked
  token: string; // Token mint address

  // Status flags (from smart contract)
  isActive: boolean;
  isCompleted: boolean;
  onChainVerificationComplete: boolean;

  // Participants
  participants: {
    walletAddress: string;
    did?: string; // Optional user DID if mapped in our system
    stakeAmount: number;
    completed: boolean; // From smart contract
    claimed: boolean; // From smart contract
    joinedAt: Date;
    // Local data for app experience
    healthData?: {
      date: string;
      steps: number;
      lastUpdated: Date;
    }[];
    progress?: number; // Percentage of goal complete
  }[];

  // Webhook tracking
  lastIndexedBlock: number;
  lastIndexedTransaction: string;
  lastEventTimestamp: Date;

  // Used for UI and reporting
  successRate?: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // New field
  isPublic: boolean;
}

const ChallengeSchema: Schema = new Schema(
  {
    // Smart contract data
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
      maxlength: 50, // Max title length
    },
    description: {
      type: String,
      required: true,
      maxlength: 250, // Max description length
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
      type: Number, // Unix timestamp
      required: true,
    },
    endTime: {
      type: Number, // Unix timestamp
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

    // Webhook tracking
    lastIndexedBlock: {
      type: Number,
      default: 0,
    },
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

// Virtual for calculating success rate
ChallengeSchema.virtual("successRate").get(function (this: Challenge) {
  const completedParticipants = this.participants.filter(
    (p) => p.completed
  ).length;
  if (this.participantCount === 0) return 0;
  return (completedParticipants / this.participantCount) * 100;
});

// Index for efficient queries
ChallengeSchema.index({ challengeId: 1 }, { unique: true });
ChallengeSchema.index({ solanaChallengePda: 1 }, { unique: true });
ChallengeSchema.index({ "participants.walletAddress": 1 }); // For user challenge lookups
ChallengeSchema.index({ isCompleted: 1, startTime: 1 }); // For status + time based queries
ChallengeSchema.index({ authority: 1 }); // For creator lookups

// Compound index for sorting and filtering
ChallengeSchema.index({
  isCompleted: 1,
  createdAt: -1,
  type: 1,
});

// Text search index with weights
ChallengeSchema.index(
  {
    challengeId: "text",
    title: "text",
    description: "text",
  },
  {
    weights: {
      challengeId: 10, // Highest priority for exact ID matches
      title: 5, // Medium priority for title matches
      description: 1, // Lower priority for description matches
    },
    name: "search_index",
  }
);

export default mongoose.model<Challenge>("Challenge", ChallengeSchema);
