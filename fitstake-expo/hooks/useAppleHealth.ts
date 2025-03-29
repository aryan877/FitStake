import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AppleHealthKit, { HealthKitPermissions } from 'react-native-health';
import { StepRecord, StepsData } from '../types';

// Check if platform is iOS
const isIOS = Platform.OS === 'ios';

// Define permissions
const permissions = {
  permissions: {
    read: [AppleHealthKit.Constants.Permissions.Steps],
    write: [],
  },
} as HealthKitPermissions;

export const useAppleHealth = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [stepsData, setStepsData] = useState<StepsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setupCompleted = useRef(false);

  // Initialize Apple HealthKit
  const initialize = useCallback(async () => {
    if (!isIOS) return false;

    try {
      return new Promise<boolean>((resolve) => {
        AppleHealthKit.initHealthKit(permissions, (err) => {
          if (err) {
            console.error('Error initializing Apple HealthKit:', err);
            setError('Failed to initialize Apple HealthKit');
            resolve(false);
            return;
          }

          setIsInitialized(true);
          resolve(true);
        });
      });
    } catch (err) {
      console.error('Exception initializing Apple HealthKit:', err);
      setError('Failed to initialize Apple HealthKit');
      return false;
    }
  }, []);

  // Check if we have permissions - improved to check all required permissions
  const checkPermissions = useCallback(async () => {
    try {
      return new Promise<boolean>((resolve) => {
        AppleHealthKit.getAuthStatus(permissions, (err, result) => {
          if (err) {
            console.error('Error checking permissions:', err);
            resolve(false);
            return;
          }

          const hasPermissions =
            !!result?.permissions?.read &&
            Array.isArray(result.permissions.read);

          setHasPermissions(hasPermissions);
          resolve(hasPermissions);
        });
      });
    } catch (err) {
      console.error('Exception checking permissions:', err);
      return false;
    }
  }, [isInitialized]);

  // Request permissions
  const requestPermissions = useCallback(async () => {
    if (!isIOS || !isInitialized) return false;

    try {
      return new Promise<boolean>((resolve) => {
        AppleHealthKit.initHealthKit(permissions, (err) => {
          if (err) {
            console.error('Error requesting permissions:', err);
            setError('Failed to request permissions');
            resolve(false);
            return;
          }

          // If initialization succeeds, check if we actually got the permissions
          checkPermissions().then(resolve);
        });
      });
    } catch (err) {
      console.error('Exception requesting permissions:', err);
      setError('Failed to request permissions');
      return false;
    }
  }, [isInitialized, checkPermissions]);

  // Fetch steps data for a specific date range
  const fetchStepsForDateRange = useCallback(
    async (startDate: Date, endDate: Date) => {
      if (!isIOS) {
        return [];
      }

      if (!isInitialized || !hasPermissions) {
        try {
          const initialized = await initialize();
          if (initialized) {
            const granted = await requestPermissions();
            if (!granted) return [];
          } else {
            return [];
          }
        } catch (err) {
          console.error('Failed to initialize Apple HealthKit:', err);
          return [];
        }
      }

      setLoading(true);
      setError(null);

      try {
        const dayDiff = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
        );
        const results: StepsData[] = [];

        // Clone start date to avoid modifying the input
        const currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0); // Ensure we start at midnight

        // Process each day in parallel for better performance
        const promises = Array.from({ length: dayDiff + 1 }, async (_, i) => {
          const date = new Date(currentDate);
          date.setDate(currentDate.getDate() + i);
          const dateString = date.toISOString().split('T')[0];
          const displayDate = date.toLocaleDateString();

          try {
            const midnightToday = new Date(date);
            midnightToday.setHours(0, 0, 0, 0);

            const [stepCount, detailedSteps] = await Promise.all([
              new Promise<any>((resolve) => {
                AppleHealthKit.getStepCount(
                  {
                    date: midnightToday.toISOString(),
                    includeManuallyAdded: false,
                  },
                  (err, results) => {
                    if (err) {
                      console.error(
                        `Error fetching steps for ${displayDate}:`,
                        err
                      );
                      resolve({ value: 0 });
                      return;
                    }
                    resolve(results || { value: 0 });
                  }
                );
              }),
              new Promise<any>((resolve) => {
                AppleHealthKit.getDailyStepCountSamples(
                  {
                    startDate: midnightToday.toISOString(),
                    endDate: new Date(
                      midnightToday.getTime() + 86399999
                    ).toISOString(),
                  },
                  (err, results) => {
                    if (err) {
                      console.error(
                        `Error fetching step samples for ${displayDate}:`,
                        err
                      );
                      resolve([]);
                      return;
                    }
                    resolve(results || []);
                  }
                );
              }),
            ]);

            const dataSources = new Set<string>();
            const recordCount = detailedSteps.length || 0;
            const timestamps: number[] = [];
            const individualRecords: StepRecord[] = [];

            if (recordCount > 0) {
              detailedSteps.forEach((record: any) => {
                if (record.source) dataSources.add(record.source);
                if (record.startDate)
                  timestamps.push(new Date(record.startDate).getTime());
                individualRecords.push({
                  count: record.value || 0,
                  startTime: record.startDate,
                  endTime: record.endDate,
                  dataOrigin: record.source,
                  id: record.id || `${record.startDate}-${record.endDate}`,
                });
              });
            }

            return {
              date: displayDate,
              dateISO: dateString,
              count: stepCount.value || 0,
              sources: Array.from(dataSources),
              recordCount,
              timestamps: timestamps.slice(0, 10),
              records: individualRecords,
            };
          } catch (err) {
            console.error(`Error processing steps for ${displayDate}:`, err);
            return {
              date: displayDate,
              dateISO: dateString,
              count: 0,
              sources: [],
              recordCount: 0,
              timestamps: [],
              records: [],
            };
          }
        });

        const processedResults = await Promise.all(promises);
        results.push(...processedResults);

        setStepsData(results);
        return results;
      } catch (err) {
        console.error('Failed to fetch steps data for date range:', err);
        setError('Failed to fetch steps data for date range');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [isInitialized, hasPermissions, initialize, requestPermissions]
  );

  // Fetch steps data for the last 7 days
  const fetchStepsData = useCallback(async () => {
    if (!isIOS || !isInitialized || !hasPermissions) return [];

    // Use the more reliable date range function to get last 7 days
    const endDate = new Date(); // Now
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6); // Last 7 days (including today)

    // Reset hours to midnight for consistent day boundaries
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return fetchStepsForDateRange(startDate, endDate);
  }, [isInitialized, hasPermissions, fetchStepsForDateRange]);

  // Get steps data for the last week (for challenge progress tracking)
  const getStepsForLastWeek = useCallback(async () => {
    if (!isIOS) return [];

    if (!isInitialized || !hasPermissions) {
      const initialized = await initialize();
      if (initialized) {
        let hasPerms = await checkPermissions();
        if (!hasPerms) {
          hasPerms = await requestPermissions();
        }
        if (!hasPerms) return [];
      } else {
        return [];
      }
    }

    // Use the more reliable date range function to get last 7 days
    const endDate = new Date(); // Now
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6); // Last 7 days (including today)

    // Ensure proper day boundaries for consistent aggregation
    startDate.setHours(0, 0, 0, 0); // Midnight start
    endDate.setHours(23, 59, 59, 999); // End of day

    // Call our reliable function to fetch the data
    return fetchStepsForDateRange(startDate, endDate);
  }, [
    isInitialized,
    hasPermissions,
    initialize,
    checkPermissions,
    requestPermissions,
    fetchStepsForDateRange,
  ]);

  // Improved setup function with better error handling
  const setupAppleHealth = useCallback(async () => {
    if (!isIOS) return false;

    try {
      // Reset setup state for a fresh start
      setupCompleted.current = false;
      setError(null);

      // Use the improved function for fetching data
      const endDate = new Date(); // Now
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6); // Last 7 days (including today)

      await fetchStepsForDateRange(startDate, endDate);
      setupCompleted.current = true;
      return true;
    } catch (error) {
      console.error('Error during Apple Health setup:', error);
      setError('Failed to set up Apple Health integration');
      return false;
    }
  }, [initialize, requestPermissions, fetchStepsForDateRange]);

  useEffect(() => {
    if (isIOS && !setupCompleted.current) {
      setupAppleHealth();
    }
  }, [setupAppleHealth]);

  const refreshStepsData = useCallback(async () => {
    setupCompleted.current = false;

    if (isInitialized) {
      let hasPerms = await checkPermissions();
      if (!hasPerms) {
        hasPerms = await requestPermissions();
      }
      if (hasPerms) {
        // Use improved function for getting step data
        const endDate = new Date(); // Now
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 6); // Last 7 days (including today)

        // Ensure proper day boundaries
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        return fetchStepsForDateRange(startDate, endDate);
      }
    } else {
      await setupAppleHealth();
    }
    return [];
  }, [
    isInitialized,
    checkPermissions,
    requestPermissions,
    setupAppleHealth,
    fetchStepsForDateRange,
  ]);

  return {
    isIOS,
    isInitialized,
    hasPermissions,
    stepsData,
    loading,
    error,
    initialize,
    requestPermissions,
    fetchStepsData,
    fetchStepsForDateRange,
    setupAppleHealth,
    refreshStepsData,
    getStepsForLastWeek,
  };
};
