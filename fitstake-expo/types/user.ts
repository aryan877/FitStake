export interface UserStats {
  totalStepCount: number;
  challengesCompleted: number;
  challengesJoined: number;
  challengesCreated: number;
  totalStaked: number;
  totalEarned: number;
  winRate: number;
  lastUpdated?: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  criteria: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  category: 'steps' | 'challenges' | 'social' | 'achievement' | 'special';
}

export interface UserBadge {
  badgeId: string;
  earnedAt: Date;
}

export interface UserChallengeParams {
  page?: number;
  limit?: number;
  status?: string;
}
