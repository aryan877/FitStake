import { getAccessToken } from '@privy-io/expo';
import axios from 'axios';
import { StepsData } from '../../types';

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

// Admin endpoints
export const adminApi = {
  // Check if user is an admin
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
      searchText?: string;
      visibility?: string;
      challengeId?: string;
    } = {}
  ) => {
    try {
      const cleanParams: Record<string, any> = {};

      // Handle search text (includes challenge ID, title, and description)
      if (params.searchText?.trim()) {
        cleanParams.searchText = params.searchText.trim();
      }

      // Handle status - make sure 'any' is not sent to backend
      if (params.status && params.status !== 'any') {
        cleanParams.status = params.status;
      }

      // Handle visibility - make sure valid values are sent
      if (params.visibility) {
        cleanParams.visibility = params.visibility;
      }

      // Copy pagination and sorting params
      ['page', 'limit', 'sortBy', 'sortOrder', 'challengeId', 'type'].forEach(
        (key) => {
          if (params[key as keyof typeof params] !== undefined) {
            cleanParams[key] = params[key as keyof typeof params];
          }
        }
      );

      // Handle numeric values with validation
      // All min/max values should be positive numbers
      ['minGoal', 'maxGoal', 'minParticipants', 'maxParticipants'].forEach(
        (key) => {
          const value = params[key as keyof typeof params];
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

      // Special handling for stake amounts - convert from SOL to lamports
      // The backend expects values in lamports (1 SOL = 1,000,000,000 lamports)
      if (
        params.minStake !== undefined &&
        !isNaN(Number(params.minStake)) &&
        Number(params.minStake) >= 0
      ) {
        const lamports = Math.floor(Number(params.minStake) * 1_000_000_000);
        if (lamports > 0) {
          cleanParams.minStake = lamports;
        }
      }

      if (
        params.maxStake !== undefined &&
        !isNaN(Number(params.maxStake)) &&
        Number(params.maxStake) >= 0
      ) {
        const lamports = Math.floor(Number(params.maxStake) * 1_000_000_000);
        if (lamports > 0) {
          cleanParams.maxStake = lamports;
        }
      }

      console.log('API request params:', cleanParams);
      const response = await api.get('/challenges', { params: cleanParams });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch challenges');
      }

      return response.data;
    } catch (error: any) {
      console.error('API Error - getAll challenges:', error);
      throw new Error(error.response?.data?.message || error.message);
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
      console.error(`API Error - getById challenge ${id}:`, error);
      throw new Error(error.response?.data?.message || error.message);
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
      const cleanParams: Record<string, any> = {};

      // Handle pagination and status params
      if (params.page !== undefined) cleanParams.page = params.page;
      if (params.limit !== undefined) cleanParams.limit = params.limit;
      if (params.status !== undefined) cleanParams.status = params.status;

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
      console.error('API Error - getUserChallenges:', error);
      throw new Error(error.response?.data?.message || error.message);
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
      console.error('API Error - createChallenge:', error);
      throw new Error(error.response?.data?.message || error.message);
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
      console.error(`API Error - joinChallenge ${id}:`, error);
      throw new Error(error.response?.data?.message || error.message);
    }
  },

  // Submit health data for a challenge
  submitHealthData: async (
    id: string,
    healthData: StepsData[],
    targetSteps: number
  ) => {
    try {
      const response = await api.post(`/health/challenges/${id}/health-data`, {
        healthData,
        targetSteps,
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || 'Failed to submit health data'
        );
      }

      return response.data;
    } catch (error: any) {
      console.error(`API Error - submitHealthData for challenge ${id}:`, error);
      throw new Error(error.response?.data?.message || error.message);
    }
  },

  // Claim rewards for a completed challenge
  claimReward: async (id: string, transactionId: string) => {
    try {
      const response = await api.post(`/health/challenges/${id}/claim`, {
        transactionId,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to claim reward');
      }

      return response.data;
    } catch (error: any) {
      console.error(`API Error - claimReward for challenge ${id}:`, error);
      throw new Error(error.response?.data?.message || error.message);
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
};

export default api;
