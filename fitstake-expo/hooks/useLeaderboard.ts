import { useCallback, useState } from 'react';
import { leaderboardApi } from '../app/services/api';

interface LeaderboardEntry {
  username: string;
  walletAddress: string;
  stats: {
    totalStepCount: number;
    challengesCompleted: number;
    challengesJoined: number;
    challengesCreated: number;
    totalStaked: number;
    totalEarned: number;
    winRate: number;
  };
  badgeCount: number;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface LeaderboardParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  pagination: PaginationInfo;
}

const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default params state
  const [params, setParams] = useState<LeaderboardParams>({
    page: 1,
    limit: 10,
    sortBy: 'stats.totalStepCount',
    sortOrder: 'desc',
  });

  /**
   * Fetch all-time leaderboard data
   */
  const fetchLeaderboard = useCallback(
    async (newParams?: LeaderboardParams) => {
      setLoading(true);
      setError(null);

      try {
        // Use provided params or default params
        const queryParams = newParams || params;

        // If new params were provided, update the params state
        if (newParams) {
          setParams(newParams);
        }

        const response = await leaderboardApi.getAllTime(queryParams);

        if (response.success && response.data) {
          const { leaderboard: leaderboardData, pagination: paginationData } =
            response.data;
          setLeaderboard(leaderboardData || []);
          setPagination(paginationData || pagination);
          return {
            leaderboard: leaderboardData,
            pagination: paginationData,
          } as LeaderboardResponse;
        } else {
          setLeaderboard([]);
          throw new Error(response.message || 'Failed to fetch leaderboard');
        }
      } catch (err: any) {
        console.error('Error fetching leaderboard:', err);
        setError(err.message || 'Failed to fetch leaderboard');
        setLeaderboard([]);
        return { leaderboard: [], pagination } as LeaderboardResponse;
      } finally {
        setLoading(false);
      }
    },
    [params, pagination]
  );

  /**
   * Update sort option and fetch leaderboard
   */
  const updateSort = useCallback(
    async (sortBy: string, sortOrder: 'asc' | 'desc' = 'desc') => {
      const newParams = { ...params, sortBy, sortOrder, page: 1 };
      return fetchLeaderboard(newParams);
    },
    [params, fetchLeaderboard]
  );

  /**
   * Change page and fetch leaderboard
   */
  const changePage = useCallback(
    async (page: number) => {
      if (page < 1 || page > pagination.pages) return;

      const newParams = { ...params, page };
      return fetchLeaderboard(newParams);
    },
    [params, pagination.pages, fetchLeaderboard]
  );

  return {
    leaderboard,
    pagination,
    loading,
    error,
    params,
    fetchLeaderboard,
    updateSort,
    changePage,
  };
};

export default useLeaderboard;
