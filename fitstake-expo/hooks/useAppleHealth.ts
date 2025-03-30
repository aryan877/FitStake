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

  // Fetch steps data for a specific date-time range
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
        // Use the exact time boundaries provided
        const start = new Date(startDate);
        const end = new Date(endDate);

        // For daily totals, use the more accurate getStepCount if the range is for a full day
        const isFullDay =
          start.getHours() === 0 &&
          start.getMinutes() === 0 &&
          start.getSeconds() === 0 &&
          end.getHours() === 23 &&
          end.getMinutes() === 59;

        let totalSteps = 0;

        if (isFullDay) {
          // Use getStepCount for a single day, which is more reliable for daily totals
          totalSteps = await new Promise<number>((resolve) => {
            AppleHealthKit.getStepCount(
              {
                date: start.toISOString(),
                includeManuallyAdded: true,
              },
              (err, results) => {
                if (err) {
                  console.error('Error fetching step count:', err);
                  resolve(0);
                  return;
                }
                resolve(results?.value || 0);
              }
            );
          });
        }

        // Get all step samples within the exact time range (for details or non-daily ranges)
        const detailedSteps = await new Promise<any>((resolve) => {
          AppleHealthKit.getDailyStepCountSamples(
            {
              startDate: start.toISOString(),
              endDate: end.toISOString(),
              includeManuallyAdded: true,
            },
            (err, results) => {
              if (err) {
                console.error(
                  `Error fetching step samples for time range:`,
                  err
                );
                resolve([]);
                return;
              }
              resolve(results || []);
            }
          );
        });

        // Create a display date format that shows the time range
        const formatDateTime = (date: Date) => {
          return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}`;
        };

        const displayDate = `${formatDateTime(start)} - ${formatDateTime(end)}`;

        // Process all records in the time range
        const dataSources = new Set<string>();
        const recordCount = detailedSteps.length || 0;
        const timestamps: number[] = [];
        const individualRecords: StepRecord[] = [];

        // Process records
        if (recordCount > 0) {
          detailedSteps.forEach((record: any) => {
            if (record.metadata?.[0]?.sourceId) {
              dataSources.add(record.metadata[0].sourceId);
            } else if (record.metadata?.[0]?.sourceName) {
              dataSources.add(record.metadata[0].sourceName);
            }

            if (record.startDate) {
              timestamps.push(new Date(record.startDate).getTime());
            }

            individualRecords.push({
              count: record.value || 0,
              startTime: record.startDate || '',
              endTime: record.endTime || '',
              dataOrigin: record.metadata?.[0]?.sourceName || '',
              id:
                record.startDate && record.endTime
                  ? `${record.startDate}-${record.endTime}`
                  : `record-${Date.now()}-${Math.random()}`,
            });
          });
        }

        // If we didn't get total steps from getStepCount (non-daily range), calculate from samples
        if (!isFullDay || totalSteps === 0) {
          totalSteps = individualRecords.reduce(
            (sum, record) => sum + record.count,
            0
          );
        }

        // Get the date for ISO format - normalize to the start date's calendar day
        const dateForIso = new Date(start);
        dateForIso.setHours(0, 0, 0, 0);
        const dateIso = dateForIso.toISOString().split('T')[0]; // YYYY-MM-DD

        // Create the result object
        const result: StepsData = {
          date: displayDate,
          dateISO: dateIso,
          count: totalSteps,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          sources: Array.from(dataSources),
          recordCount,
          timestamps: timestamps.slice(0, 10),
          records: individualRecords,
        };

        const results = [result];
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

    try {
      setLoading(true);

      // Get steps for each day in the last week individually
      const now = new Date();
      const results: StepsData[] = [];

      // Process the last 7 days (including today)
      for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);

        // Set to midnight for start and end of day
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        // Format dates for consistency
        const dateISO = dayStart.toISOString().split('T')[0]; // YYYY-MM-DD
        const dateString = dayStart.toLocaleDateString('en-US'); // MM/DD/YYYY

        // Get daily step count using getStepCount
        const dailySteps = await new Promise<number>((resolve) => {
          AppleHealthKit.getStepCount(
            {
              date: dayStart.toISOString(),
              includeManuallyAdded: true,
            },
            (err, results) => {
              if (err) {
                console.error(
                  `Error fetching step count for day ${dateString}:`,
                  err
                );
                resolve(0);
                return;
              }
              resolve(results?.value || 0);
            }
          );
        });

        // Get detailed samples for the day
        const detailedSamples = await new Promise<any[]>((resolve) => {
          AppleHealthKit.getDailyStepCountSamples(
            {
              startDate: dayStart.toISOString(),
              endDate: dayEnd.toISOString(),
              includeManuallyAdded: true,
            },
            (err, results) => {
              if (err) {
                console.error(
                  `Error fetching step samples for day ${dateString}:`,
                  err
                );
                resolve([]);
                return;
              }
              resolve(results || []);
            }
          );
        });

        // Process detailed samples for this day
        const dataSources = new Set<string>();
        const timestamps: number[] = [];
        const records: StepRecord[] = [];

        if (detailedSamples.length > 0) {
          detailedSamples.forEach((sample) => {
            // Extract source information
            if (sample.metadata?.[0]?.sourceId) {
              dataSources.add(sample.metadata[0].sourceId);
            } else if (sample.metadata?.[0]?.sourceName) {
              dataSources.add(sample.metadata[0].sourceName);
            }

            // Add timestamp
            if (sample.startDate) {
              timestamps.push(new Date(sample.startDate).getTime());
            }

            // Create record
            records.push({
              count: sample.value || 0,
              startTime: sample.startDate || '',
              endTime: sample.endDate || '',
              dataOrigin: sample.metadata?.[0]?.sourceName || '',
              id:
                sample.metadata?.[0]?.sourceId ||
                `record-${Date.now()}-${Math.random()}`,
            });
          });
        }

        // Create a standardized record for this day
        results.push({
          date: dateString,
          dateISO: dateISO,
          count: dailySteps,
          startTime: dayStart.toISOString(),
          endTime: dayEnd.toISOString(),
          sources: Array.from(dataSources),
          recordCount: detailedSamples.length,
          timestamps: timestamps.slice(0, 10),
          records: records,
        });
      }

      setStepsData(results);
      return results;
    } catch (error) {
      console.error('Error fetching steps for last week:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [
    isInitialized,
    hasPermissions,
    initialize,
    checkPermissions,
    requestPermissions,
  ]);

  // Improved setup function with better error handling
  const setupAppleHealth = useCallback(async () => {
    if (!isIOS) return false;

    try {
      // Reset setup state for a fresh start
      setupCompleted.current = false;
      setError(null);

      await getStepsForLastWeek();
      setupCompleted.current = true;
      return true;
    } catch (error) {
      console.error('Error during Apple Health setup:', error);
      setError('Failed to set up Apple Health integration');
      return false;
    }
  }, [getStepsForLastWeek]);

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
        return getStepsForLastWeek();
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
    getStepsForLastWeek,
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
    fetchStepsForDateRange,
    setupAppleHealth,
    refreshStepsData,
    getStepsForLastWeek,
  };
};
