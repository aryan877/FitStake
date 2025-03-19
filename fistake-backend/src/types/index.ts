import { Types } from "mongoose";

export interface User {
  id?: string;
  email: string;
  password: string;
  walletAddress?: string;
  fitnessIntegrations: {
    googleFit: {
      connected: boolean;
      accessToken?: string;
      refreshToken?: string;
    };
    appleHealth: {
      connected: boolean;
      userId?: string;
    };
    fitbit: {
      connected: boolean;
      accessToken?: string;
      refreshToken?: string;
    };
  };
  createdAt: Date;
}

export interface Challenge {
  id?: string;
  title: string;
  description: string;
  type: "steps" | "distance" | "workout" | "custom";
  goal: number;
  unit: string;
  stakeAmount: number;
  startDate: Date;
  endDate: Date;
  escrowAddress: string;
  status: "pending" | "active" | "completed" | "cancelled";
  createdAt: Date;
}

export interface Participation {
  id?: string;
  userId: Types.ObjectId | string;
  challengeId: Types.ObjectId | string;
  stakeTxId: string;
  dailyProgress: Array<{
    date: Date;
    value: number;
    verified: boolean;
    verificationSource: string;
  }>;
  status: "active" | "completed" | "failed";
  completionPercentage: number;
  reward?: {
    amount: number;
    txId: string;
    claimedAt: Date;
  };
  joinedAt: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

// Solana-specific types
export interface SolanaAccount {
  publicKey: string;
  secretKey?: Uint8Array;
}

export interface ChallengeCreationParams {
  challengeId: string;
  stakeAmount: number;
  startTime: number;
  endTime: number;
  minParticipants: number;
  maxParticipants: number;
}

export interface SolanaTransactionResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}
