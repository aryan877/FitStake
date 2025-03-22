/**
 * Types related to fitness challenges
 */

import { StepsData } from './health';

/**
 * Challenge visibility options
 */
export type ChallengeVisibility = 'public' | 'private' | 'all';

/**
 * Parameters for creating a new challenge
 */
export interface CreateChallengeParams {
  title: string;
  description: string;
  stakeAmount: number; // in lamports
  startTime: number; // unix timestamp
  endTime: number; // unix timestamp
  minParticipants: number;
  maxParticipants: number;
  goalSteps: number;
  isPublic?: boolean; // Whether the challenge is public (only for admins)
}

/**
 * Challenge data structure
 */
export interface ChallengeData {
  id: string; // MongoDB _id
  challengeId: string; // Unique ID from smart contract
  solanaChallengePda: string;
  solanaVaultPda: string;
  authority: string;
  admin: string;
  title: string;
  description: string;
  type: 'STEPS';
  goal: {
    value: number;
    unit: string;
  };
  startTime: number;
  endTime: number;
  stakeAmount: number;
  minParticipants: number;
  maxParticipants: number;
  participantCount: number;
  totalStake: number;
  token: string;
  isActive: boolean;
  isCompleted: boolean;
  isPublic: boolean;
  participants: Array<{
    walletAddress: string;
    did?: string;
    stakeAmount: number;
    completed: boolean;
    claimed: boolean;
    joinedAt: Date;
    healthData?: StepsData[];
    progress?: number;
  }>;
}

/**
 * User-specific challenge data structure
 */
export interface UserChallenge {
  id: string;
  title: string;
  description: string;
  type: 'STEPS';
  goal: {
    value: number;
    unit: string;
  };
  startTime: number;
  endTime: number;
  stakeAmount: number;
  token: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

/**
 * Challenge progress tracking
 */
export interface ChallengeProgress {
  challengeId: string;
  progress: number;
  isCompleted: boolean;
  totalSteps: number;
}

/**
 * Filter parameters for challenges
 */
export interface ChallengeFilters {
  type?: string;
  status?: string;
  minStake?: number;
  maxStake?: number;
  minGoal?: number;
  maxGoal?: number;
  minParticipants?: number;
  maxParticipants?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  visibility?: ChallengeVisibility;
  searchText?: string;
}

/**
 * Participant in a challenge
 */
export interface Participant {
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
}

/**
 * Challenge details for display
 */
export interface ChallengeDetails {
  id: string; // MongoDB _id
  challengeId: string; // Unique ID from smart contract
  title: string;
  description: string;
  goal: {
    value: number;
    unit: string;
  };
  stakeAmount: number;
  token: string;
  startTime: number;
  endTime: number;
  participants: Participant[];
  participantCount: number;
  maxParticipants: number;
  isActive: boolean;
  isCompleted: boolean;
  isPublic: boolean;
}
