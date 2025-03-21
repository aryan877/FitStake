import { getAccessToken } from '@privy-io/expo';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import axios from 'axios';

export interface StepsData {
  count: number;
  date: string;
}

// Get backend URL from environment variables
const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add an interceptor to add authentication token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      // Get token from Privy
      const token = await getAccessToken();

      // If we have a token, add it to the request
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      console.error('Error adding auth token to request:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  // Get user profile
  getUserProfile: async () => {
    try {
      const response = await api.get('/auth/user');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create or update user with wallet
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

  // Check if username is available
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

  // Update username
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

// Challenge endpoints
export const challengeApi = {
  // Get all challenges with pagination and filters
  getAll: async (
    params: {
      page?: number;
      limit?: number;
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
    } = {}
  ) => {
    try {
      const cleanParams: Record<string, any> = {};

      // Copy string/simple params directly
      ['page', 'limit', 'type', 'status', 'sortBy', 'sortOrder'].forEach(
        (key) => {
          if (params[key as keyof typeof params] !== undefined) {
            cleanParams[key] = params[key as keyof typeof params];
          }
        }
      );

      // Handle SOL to lamports conversion
      ['minStake', 'maxStake'].forEach((key) => {
        const value = params[key as keyof typeof params];
        if (value !== undefined) {
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            cleanParams[key] = Math.floor(numValue * LAMPORTS_PER_SOL);
          }
        }
      });

      // Handle numeric values
      ['minGoal', 'maxGoal', 'minParticipants', 'maxParticipants'].forEach(
        (key) => {
          const value = params[key as keyof typeof params];
          if (value !== undefined && !isNaN(Number(value))) {
            cleanParams[key] = Number(value);
          }
        }
      );

      console.log('Clean params sent to server:', cleanParams);
      const response = await api.get('/challenges', { params: cleanParams });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get challenge by ID
  getById: async (id: string) => {
    try {
      const response = await api.get(`/challenges/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching challenge ${id}:`, error);
      throw error;
    }
  },

  // Get challenges for the current user
  getUserChallenges: async (
    params: {
      page?: number;
      limit?: number;
      status?: string;
    } = {}
  ) => {
    try {
      // Create a clean copy of params
      const cleanParams: Record<string, any> = {};

      // Handle pagination and text params
      if (params.page !== undefined) cleanParams.page = params.page;
      if (params.limit !== undefined) cleanParams.limit = params.limit;
      if (params.status !== undefined) cleanParams.status = params.status;

      console.log(
        'Clean params sent to server for user challenges:',
        cleanParams
      );
      const response = await api.get('/challenges/user/challenges', {
        params: cleanParams,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user challenges:', error);
      throw error;
    }
  },

  // Create a new challenge from smart contract data
  createChallenge: async (data: any) => {
    try {
      const response = await api.post('/challenges', data);
      return response.data;
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  },

  // Join a challenge
  joinChallenge: async (id: string) => {
    try {
      const response = await api.post(`/challenges/${id}/join`);
      return response.data;
    } catch (error) {
      console.error(`Error joining challenge ${id}:`, error);
      throw error;
    }
  },

  // Submit health data for a challenge
  submitHealthData: async (
    id: string,
    data: {
      healthData: StepsData[];
      progress: number;
      isCompleted: boolean;
    }
  ) => {
    try {
      const response = await api.post(
        `/health/challenges/${id}/health-data`,
        data
      );
      return response.data;
    } catch (error) {
      console.error(`Error submitting health data for challenge ${id}:`, error);
      throw error;
    }
  },

  // Get current progress for a challenge
  getProgress: async (id: string) => {
    try {
      const response = await api.get(`/health/challenges/${id}/progress`);
      return response.data;
    } catch (error) {
      console.error(`Error getting progress for challenge ${id}:`, error);
      throw error;
    }
  },

  // Force sync health data for all user's active challenges
  syncAllChallenges: async () => {
    try {
      const response = await api.post('/health/challenges/sync-health-data');
      return response.data;
    } catch (error) {
      console.error('Error syncing health data for challenges:', error);
      throw error;
    }
  },
};

export default api;
