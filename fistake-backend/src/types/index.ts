import { Types } from "mongoose";

export interface User {
  privyId: string;
  walletAddress: string;
  username: string;
  createdAt: Date;
}

export interface Challenge {
  id?: string;
  title: string;
  description: string;
  type: "STEPS";
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
