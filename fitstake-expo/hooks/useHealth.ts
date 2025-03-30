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

  // Memoize platform constants to prevent re-renders
  const platform = useMemo(() => ({ isAndroid, isIOS }), []);

  // Use implementation based on platform - memoized
  const implementation = useMemo(() => {
    return platform.isIOS ? appleHealth : healthConnect;
  }, [platform.isIOS, appleHealth, healthConnect]);

  // Local loading state
  const [localLoading, setLocalLoading] = useState(false);

  // Memoize implementation states to prevent re-renders
  const implementationState = useMemo(
    () => ({
      isInitialized: implementation.isInitialized,
      hasPermissions: implementation.hasPermissions,
      stepsData: implementation.stepsData,
      error: implementation.error,
    }),
    [
      implementation.isInitialized,
      implementation.hasPermissions,
      implementation.stepsData,
      implementation.error,
    ]
  );

  // Returns the current health provider name for backend verification
  const getHealthProvider = useCallback(() => {
    return platform.isIOS ? 'apple' : 'android';
  }, [platform]);

  // Initialize health service
  const initialize = useCallback(async () => {
    if (platform.isIOS) {
      return appleHealth.initialize();
    } else if (platform.isAndroid) {
      return healthConnect.initialize();
    }
    return false;
  }, [platform, appleHealth, healthConnect]);

  // Request permissions
  const requestPermissions = useCallback(async () => {
    if (platform.isIOS) {
      return appleHealth.requestPermissions();
    } else if (platform.isAndroid) {
      return healthConnect.requestPermissions();
    }
    return false;
  }, [platform, appleHealth, healthConnect]);

  // Memoize the fetchStepsForDateRange function to prevent unnecessary re-renders
  const fetchStepsForDateRange = useCallback(
    async (startDate: Date, endDate: Date) => {
      try {
        setLocalLoading(true);

        if (platform.isIOS) {
          const result = await appleHealth.fetchStepsForDateRange(
            startDate,
            endDate
          );
          return result;
        } else if (platform.isAndroid) {
          const result = await healthConnect.fetchStepsForDateRange(
            startDate,
            endDate
          );
          return result;
        }
        return [];
      } catch (error) {
        console.error('Error fetching steps for date range:', error);
        return [];
      } finally {
        setLocalLoading(false);
      }
    },
    [platform, appleHealth, healthConnect]
  );

  // Setup health service
  const setupHealth = useCallback(async () => {
    try {
      setLocalLoading(true);
      if (platform.isIOS) {
        return await appleHealth.setupAppleHealth();
      } else if (platform.isAndroid) {
        return await healthConnect.setupHealthConnect();
      }
      return false;
    } catch (error) {
      console.error('Error setting up health service:', error);
      return false;
    } finally {
      setLocalLoading(false);
    }
  }, [platform, appleHealth, healthConnect]);

  // Refresh steps data
  const refreshStepsData = useCallback(async () => {
    try {
      setLocalLoading(true);
      if (platform.isIOS) {
        return await appleHealth.refreshStepsData();
      } else if (platform.isAndroid) {
        return await healthConnect.refreshStepsData();
      }
      return [];
    } catch (error) {
      console.error('Error refreshing steps data:', error);
      return [];
    } finally {
      setLocalLoading(false);
    }
  }, [platform, appleHealth, healthConnect]);

  // Get steps for last week
  const getStepsForLastWeek = useCallback(async () => {
    if (platform.isIOS) {
      return appleHealth.getStepsForLastWeek();
    } else if (platform.isAndroid) {
      return healthConnect.getStepsForLastWeek();
    }
    return [];
  }, [platform, appleHealth, healthConnect]);

  // Memoize methods object to prevent re-creation on each render
  const methods = useMemo(
    () => ({
      initialize,
      requestPermissions,
      fetchStepsForDateRange,
      setupHealth,
      refreshStepsData,
      getStepsForLastWeek,
      getHealthProvider,
    }),
    [
      initialize,
      requestPermissions,
      fetchStepsForDateRange,
      setupHealth,
      refreshStepsData,
      getStepsForLastWeek,
      getHealthProvider,
    ]
  );

  return {
    ...platform,
    ...implementationState,
    loading: localLoading || implementation.loading,
    ...methods,
  };
};
