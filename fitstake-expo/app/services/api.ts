import { getAccessToken } from '@privy-io/expo';
import axios from 'axios';

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
    } = {}
  ) => {
    try {
      const response = await api.get('/challenges', { params });
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
      const response = await api.get('/challenges/user/challenges', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user challenges:', error);
      throw error;
    }
  },

  // Create a new challenge
  create: async (data: {
    title: string;
    description: string;
    type: 'STEPS' | 'WORKOUT' | 'SLEEP' | 'CUSTOM';
    goal: { value: number; unit: string };
    duration: { days: number; startDate?: Date; endDate?: Date };
    stake: { amount: number; token: string };
  }) => {
    try {
      const response = await api.post('/challenges', data);
      return response.data;
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  },

  // Join a challenge
  join: async (id: string) => {
    try {
      const response = await api.post(`/challenges/${id}/join`);
      return response.data;
    } catch (error) {
      console.error(`Error joining challenge ${id}:`, error);
      throw error;
    }
  },

  // Update challenge status (complete, fail)
  updateStatus: async (
    id: string,
    status: 'ACTIVE' | 'COMPLETED' | 'FAILED'
  ) => {
    try {
      const response = await api.patch(`/challenges/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating challenge ${id} status:`, error);
      throw error;
    }
  },
};

export default api;
