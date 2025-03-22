/**
 * Types related to fitness challenges
 */

import { StepsData } from './health';

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
}

/**
 * Challenge data structure
 */
export interface ChallengeData {
  id: string;
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
  healthData?: StepsData[];
  progress?: number;
}

/**
 * Challenge details for display
 */
export interface ChallengeDetails {
  id: string;
  title: string;
  description: string;
  type: string;
  goal: number;
  startDate: string;
  endDate: string;
  stakeAmount: number;
  participants: Participant[];
  participantsCount: number;
  totalPot: number;
  isActive: boolean;
  isCompleted: boolean;
  userJoined: boolean;
  userCompleted: boolean;
  userProgress: number;
}
