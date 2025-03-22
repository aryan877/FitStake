import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../app/services/api';

/**
 * Hook for checking admin status
 */
export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if the current user is an admin
   */
  const checkAdminStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminApi.checkAdminStatus();
      if (response.success && response.data) {
        setIsAdmin(response.data.isAdmin);
      } else {
        setIsAdmin(false);
      }
    } catch (err: any) {
      console.error('Error checking admin status:', err);
      setError(
        `Failed to check admin status: ${err.message || 'Unknown error'}`
      );
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check admin status on initial load
  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  return {
    isAdmin,
    isLoading,
    error,
    checkAdminStatus,
  };
};
