import { LeaderboardParams } from '@/types/leaderboard';
import { UserChallengeParams } from '@/types/user';
import { getAccessToken } from '@privy-io/expo';
import axios from 'axios';
import { ChallengeParams, StepsData } from '../../types';

// API configuration
const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: BACKEND_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAccessToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    } catch (error) {
      console.error('Auth token error:', error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// Helper to standardize error handling
const handleApiError = (error: any, context: string) => {
  console.error(`API Error - ${context}:`, error);
  throw new Error(error.response?.data?.message || error.message);
};

// Auth endpoints
export const authApi = {
  getUserProfile: async () => {
    try {
      const response = await api.get('/auth/user');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createOrUpdateUser: async (walletAddress: string, username?: string) => {
    try {
      const response = await api.post('/auth/user', {
        walletAddress,
        username,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  checkUsername: async (username: string) => {
    try {
      const response = await api.get('/auth/check-username', {
        params: { username },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateUsername: async (username: string) => {
    try {
      const response = await api.patch('/auth/user', { username });
      return response.data;
    } catch (error) {
      console.error('Error updating username:', error);
      throw error;
    }
  },
};

// Admin endpoints
export const adminApi = {
  checkAdminStatus: async () => {
    try {
      const response = await api.get('/admin/check-status');
      return response.data;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return { success: false, data: { isAdmin: false } };
    }
  },
};

// Leaderboard endpoints
export const leaderboardApi = {
  getAllTime: async (params: LeaderboardParams = {}) => {
    try {
      const response = await api.get('/leaderboard/all-time', { params });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || 'Failed to fetch leaderboard'
        );
      }

      return response.data;
    } catch (error) {
      return handleApiError(error, 'getAllTime leaderboard');
    }
  },
};

// Challenge endpoints
export const challengeApi = {
  // Get all challenges with pagination and filters
  getAll: async (params: ChallengeParams = {}) => {
    try {
      const cleanParams: Record<string, any> = {};

      // Process text search
      if (params.searchText?.trim()) {
        cleanParams.searchText = params.searchText.trim();
      }

      // Process status and visibility
      if (params.status && params.status !== 'any') {
        cleanParams.status = params.status;
      }

      if (params.visibility) {
        cleanParams.visibility = params.visibility;
      }

      // Copy pagination and sorting params
      ['page', 'limit', 'sortBy', 'sortOrder', 'challengeId', 'type'].forEach(
        (key) => {
          if (params[key as keyof ChallengeParams] !== undefined) {
            cleanParams[key] = params[key as keyof ChallengeParams];
          }
        }
      );

      // Process numeric parameters
      ['minGoal', 'maxGoal', 'minParticipants', 'maxParticipants'].forEach(
        (key) => {
          const value = params[key as keyof ChallengeParams];
          if (
            value !== undefined &&
            value !== null &&
            !isNaN(Number(value)) &&
            Number(value) >= 0
          ) {
            cleanParams[key] = Number(value);
          }
        }
      );

      // Convert SOL to lamports for stake params
      ['minStake', 'maxStake'].forEach((key) => {
        const value = params[key as keyof ChallengeParams];
        if (
          value !== undefined &&
          !isNaN(Number(value)) &&
          Number(value) >= 0
        ) {
          const lamports = Math.floor(Number(value) * 1_000_000_000);
          if (lamports > 0) {
            cleanParams[key] = lamports;
          }
        }
      });

      const response = await api.get('/challenges', { params: cleanParams });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch challenges');
      }

      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'getAll challenges');
    }
  },

  // Get challenge by ID
  getById: async (id: string) => {
    try {
      const response = await api.get(`/challenges/${id}`);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch challenge');
      }
      return response.data;
    } catch (error: any) {
      return handleApiError(error, `getById challenge ${id}`);
    }
  },

  // Get user's challenges
  getUserChallenges: async (params: UserChallengeParams = {}) => {
    try {
      const cleanParams: Record<string, any> = {};

      // Copy valid parameters
      ['page', 'limit', 'status'].forEach((key) => {
        if (params[key as keyof UserChallengeParams] !== undefined) {
          cleanParams[key] = params[key as keyof UserChallengeParams];
        }
      });

      const response = await api.get('/challenges/user/challenges', {
        params: cleanParams,
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || 'Failed to fetch user challenges'
        );
      }

      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'getUserChallenges');
    }
  },

  // Create a new challenge
  createChallenge: async (data: any) => {
    try {
      const response = await api.post('/challenges', data);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to create challenge');
      }
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'createChallenge');
    }
  },

  // Join a challenge
  joinChallenge: async (id: string) => {
    try {
      const response = await api.post(`/challenges/${id}/join`);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to join challenge');
      }
      return response.data;
    } catch (error: any) {
      return handleApiError(error, `joinChallenge ${id}`);
    }
  },

  // Submit health data for a challenge
  submitHealthData: async (
    id: string,
    healthData: StepsData[],
    targetSteps: number,
    platform?: string
  ) => {
    try {
      const response = await api.post(
        `/health/challenges/${id}/health-data`,
        {
          healthData,
          targetSteps,
        },
        {
          params: { platform },
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || 'Failed to submit health data'
        );
      }

      return response.data;
    } catch (error: any) {
      return handleApiError(error, `submitHealthData for challenge ${id}`);
    }
  },

  // Claim rewards for a completed challenge
  claimReward: async (id: string, transactionId: string) => {
    try {
      const response = await api.post(`/challenges/${id}/claim`, {
        transactionId,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to claim reward');
      }

      return response.data;
    } catch (error: any) {
      return handleApiError(error, `claimReward for challenge ${id}`);
    }
  },

  // Get current progress for a challenge
  getProgress: async (id: string) => {
    try {
      const response = await api.get(`/health/challenges/${id}/progress`);
      return response.data;
    } catch (error) {
      return handleApiError(error, `getProgress for challenge ${id}`);
    }
  },
};

export default api;
