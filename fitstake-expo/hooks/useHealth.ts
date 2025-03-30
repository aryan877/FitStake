import { useCallback, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { useAppleHealth } from './useAppleHealth';
import { useHealthConnect } from './useHealthConnect';

/**
 * Health integration hook that provides unified access to health data across platforms.
 *
 * This hook combines platform-specific implementations:
 * - iOS: Uses Apple HealthKit via useAppleHealth hook
 * - Android: Uses Health Connect via useHealthConnect hook
 *
 * Data consistency:
 * - Both implementations ensure consistent StepsData format
 * - Each implementation uses the same date handling for last 7 days data
 * - Both implementations include detailed metadata for backend verification
 *
 * Usage:
 * - Use fetchStepsForDateRange to get health data for specific date ranges
 * - Use getStepsForLastWeek to get the last 7 days of health data
 */
export const useHealth = () => {
  const isAndroid = Platform.OS === 'android';
  const isIOS = Platform.OS === 'ios';

  // Use the platform-specific hooks
  const appleHealth = useAppleHealth();
  const healthConnect = useHealthConnect();

  // Use implementation based on platform - memoized
  const implementation = useMemo(() => {
    return isIOS ? appleHealth : healthConnect;
  }, [isIOS, appleHealth, healthConnect]);

  const [loading, setLoading] = useState(false);
  const { isInitialized, hasPermissions, stepsData, error } = implementation;

  // Returns the current health provider name for backend verification
  const getHealthProvider = useCallback(() => {
    return isIOS ? 'apple' : 'android';
  }, [isIOS]);

  // Initialize health service
  const initialize = useCallback(async () => {
    if (isIOS) {
      return appleHealth.initialize();
    } else if (isAndroid) {
      return healthConnect.initialize();
    }
    return false;
  }, [isIOS, isAndroid, appleHealth, healthConnect]);

  // Request permissions
  const requestPermissions = useCallback(async () => {
    if (isIOS) {
      return appleHealth.requestPermissions();
    } else if (isAndroid) {
      return healthConnect.requestPermissions();
    }
    return false;
  }, [isIOS, isAndroid, appleHealth, healthConnect]);

  // Fetch steps data
  const fetchStepsData = useCallback(async () => {
    if (isIOS) {
      return appleHealth.fetchStepsData();
    } else if (isAndroid) {
      return healthConnect.fetchStepsData();
    }
    return [];
  }, [isIOS, isAndroid, appleHealth, healthConnect]);

  // Memoize the fetchStepsForDateRange function to prevent unnecessary re-renders
  const fetchStepsForDateRange = useCallback(
    async (startDate: Date, endDate: Date) => {
      try {
        setLoading(true);
        if (isIOS) {
          return await appleHealth.fetchStepsForDateRange(startDate, endDate);
        } else if (isAndroid) {
          return await healthConnect.fetchStepsForDateRange(startDate, endDate);
        }
        return [];
      } catch (error) {
        console.error('Error fetching steps for date range:', error);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [isIOS, isAndroid, appleHealth, healthConnect]
  );

  // Setup health service
  const setupHealth = useCallback(async () => {
    try {
      setLoading(true);
      if (isIOS) {
        return await appleHealth.setupAppleHealth();
      } else if (isAndroid) {
        return await healthConnect.setupHealthConnect();
      }
      return false;
    } catch (error) {
      console.error('Error setting up health service:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isIOS, isAndroid, appleHealth, healthConnect]);

  // Refresh steps data
  const refreshStepsData = useCallback(async () => {
    try {
      setLoading(true);
      if (isIOS) {
        return await appleHealth.refreshStepsData();
      } else if (isAndroid) {
        return await healthConnect.refreshStepsData();
      }
      return [];
    } catch (error) {
      console.error('Error refreshing steps data:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isIOS, isAndroid, appleHealth, healthConnect]);

  // Get steps for last week
  const getStepsForLastWeek = useCallback(async () => {
    if (isIOS) {
      return appleHealth.getStepsForLastWeek();
    } else if (isAndroid) {
      return healthConnect.getStepsForLastWeek();
    }

    return [];
  }, [isIOS, isAndroid, appleHealth, healthConnect]);

  return {
    isIOS,
    isAndroid,
    isInitialized,
    hasPermissions,
    stepsData,
    loading,
    error,
    initialize,
    requestPermissions,
    fetchStepsData,
    fetchStepsForDateRange,
    setupHealth,
    refreshStepsData,
    getStepsForLastWeek,
    getHealthProvider,
  };
};
