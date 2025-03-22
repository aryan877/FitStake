/**
 * Types related to UI components
 */

import { ChallengeFilters } from './challenge';

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'info';

export interface ToastConfig {
  message: string;
  type: ToastType;
  duration?: number;
}

/**
 * Empty state component props
 */
export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  message?: string;
  action?: React.ReactNode;
}

/**
 * Filter chip component props
 */
export interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

/**
 * Create challenge card component props
 */
export interface CreateChallengeCardProps {
  onPress: () => void;
}

/**
 * Filter button component props
 */
export interface FilterButtonProps {
  text: string;
  icon: React.ReactNode;
  primary?: boolean;
  onPress: () => void;
}

/**
 * Challenge card component props
 */
export interface ChallengeCardProps {
  challenge: {
    id: string;
    title: string;
    description: string;
    type: string;
    goal: {
      value: number;
      unit: string;
    };
    startTime: number;
    endTime: number;
    stakeAmount: number;
    participantCount: number;
    totalStake: number;
    isActive: boolean;
    isCompleted: boolean;
  };
  onPress: () => void;
  userJoined?: boolean;
  userProgress?: number;
}

/**
 * Onboarding modal component props
 */
export interface OnboardingModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

/**
 * Filter modal component props
 */
export interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: any;
  onApply: () => void;
  onClearFilters: () => void;
  setFilters: (filters: any) => void;
}

/**
 * Challenge form data structure for CreateChallengeModal
 */
export interface ChallengeFormData {
  title: string;
  description: string;
  stakeAmount: string;
  goalSteps: string;
  startDate: Date | null;
  endDate: Date | null;
  minParticipants: string;
  maxParticipants: string;
  isPublic?: boolean;
}

/**
 * Create challenge modal component props
 */
export interface CreateChallengeModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isCreating: boolean;
  challenge: ChallengeFormData;
  onChange: (field: string, value: string | Date) => void;
}

/**
 * Avatar component props
 */
export interface AvatarProps {
  size?: number;
  uri?: string;
  walletAddress?: string;
  user?: any;
  name?: string;
}

/**
 * Active filters component props
 */
export interface ActiveFiltersProps {
  filters: ChallengeFilters;
  onClearFilters: () => void;
}

/**
 * Tab bar icon props
 */
export interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}
