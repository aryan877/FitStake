import { Types } from "mongoose";

export interface User {
  privyId: string;
  walletAddress: string;
  username: string;
  isAdmin?: boolean;
  createdAt: Date;
  stats?: UserStats;
  badges?: UserBadge[];
}

// Frontend health data structure (coming from client)
export interface FrontendHealthData {
  date: string;
  count: number;
  sources?: string[];
  recordCount?: number;
  timestamps?: number[];
}

// Backend health data structure (stored in database)
export interface BackendHealthData {
  date: string;
  steps: number;
  lastUpdated: Date;
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

// User statistics for gamification
export interface UserStats {
  totalStepCount: number;
  challengesCompleted: number;
  challengesJoined: number;
  challengesCreated: number;
  totalStaked: number;
  totalEarned: number;
  winRate: number;
  lastUpdated: Date;
}

// Badge interface for achievements
export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string; // Lucide icon name
  criteria: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  category: "steps" | "challenges" | "social" | "achievement" | "special";
}

// User's earned badge with timestamp
export interface UserBadge {
  badgeId: string;
  earnedAt: Date;
}

// Badge with details for API responses
export interface BadgeWithDetails extends Omit<Badge, "criteria"> {
  earnedAt: Date;
}

// Health data anomaly tracking
export interface AnomalyData {
  date: string;
  steps: number;
  anomalies: string[];
}

// Privy token payload structure
export interface PrivyTokenPayload {
  sid: string; // Session ID
  sub: string; // User's Privy DID
  iss: string; // Token issuer (should be privy.io)
  aud: string; // Privy app ID
  iat: number; // Timestamp when JWT was issued
  exp: number; // Expiration timestamp
}
