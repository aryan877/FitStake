import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AppleHealthKit, { HealthKitPermissions } from 'react-native-health';
import { StepRecord, StepsData } from '../types';

// Apple Health is only available on iOS
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
  const activeFetch = useRef(false);

  // Initialize Apple HealthKit
  const initialize = useCallback(async () => {
    if (!isIOS) return false;

    return new Promise<boolean>((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (err) => {
        if (err) {
          console.error('Error initializing HealthKit:', err);
          setError('Failed to initialize Apple Health');
          resolve(false);
        } else {
          setIsInitialized(true);
          resolve(true);
        }
      });
    });
  }, []);

  // Check if we have permissions
  const checkPermissions = useCallback(async () => {
    if (!isIOS || !isInitialized) return false;

    return new Promise<boolean>((resolve) => {
      // Check if we have step count permissions
      AppleHealthKit.getAuthStatus(permissions, (err, result) => {
        if (err) {
          console.error('Error checking permissions:', err);
          resolve(false);
          return;
        }

        const hasPermissions =
          !!result?.permissions?.read && Array.isArray(result.permissions.read);

        setHasPermissions(hasPermissions);
        resolve(hasPermissions);
      });
    });
  }, [isInitialized]);

  // Request permissions
  const requestPermissions = useCallback(async () => {
    if (!isIOS || !isInitialized) return false;
    // Apple Health doesn't have a separate request permissions method
    // It's included in the initialization step, so we just check here
    return await checkPermissions();
  }, [isInitialized, checkPermissions]);

  // Fetch steps data for a date range
  const fetchStepsForDateRange = useCallback(
    async (startDate: Date, endDate: Date) => {
      if (!isIOS) {
        return [];
      }

      // Prevent concurrent fetches
      if (activeFetch.current) {
        return [];
      }

      activeFetch.current = true;

      // Ensure we're initialized with permissions
      if (!isInitialized || !hasPermissions) {
        try {
          const initialized = await initialize();
          if (initialized) {
            const granted = await requestPermissions();
            if (!granted) {
              activeFetch.current = false;
              return [];
            }
          } else {
            activeFetch.current = false;
            return [];
          }
        } catch (err) {
          console.error('Failed to initialize Apple Health:', err);
          activeFetch.current = false;
          return [];
        }
      }

      setLoading(true);
      setError(null);

      try {
        return new Promise<StepsData[]>((resolve) => {
          // Format dates for Health Kit
          const options = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            includeManuallyAdded: false,
          };

          // Get detailed step samples for the time range
          AppleHealthKit.getDailyStepCountSamples(options, (err, results) => {
            if (err) {
              console.error('Error getting step samples:', err);
              setError('Failed to fetch step data');
              setLoading(false);
              activeFetch.current = false;
              resolve([]);
              return;
            }

            // Extract sources from the samples
            const dataSources = new Set<string>();
            const individualRecords: StepRecord[] = [];
            const timestamps: number[] = [];

            // Calculate total steps manually from the samples
            let totalSteps = 0;

            if (results && Array.isArray(results)) {
              results.forEach((sample) => {
                // Add to total steps
                totalSteps += sample.value || 0;

                if (sample.metadata && Array.isArray(sample.metadata)) {
                  sample.metadata.forEach((meta: any) => {
                    if (meta.sourceName) {
                      dataSources.add(meta.sourceName);
                    }
                  });
                }

                // Create a record for each sample
                individualRecords.push({
                  count: sample.value || 0,
                  startTime: sample.startDate,
                  endTime: sample.endDate,
                  id: `${sample.startDate}-${sample.endDate}`,
                });

                if (sample.startDate) {
                  timestamps.push(new Date(sample.startDate).getTime());
                }
              });
            }

            // Create a display date format that shows the time range
            const formatDateTime = (date: Date) => {
              return `${date.toLocaleDateString()} ${date.toLocaleTimeString(
                [],
                {
                  hour: '2-digit',
                  minute: '2-digit',
                }
              )}`;
            };

            const displayDate = `${formatDateTime(
              startDate
            )} - ${formatDateTime(endDate)}`;

            // Get the date for ISO format
            const dateForIso = new Date(startDate);
            dateForIso.setHours(0, 0, 0, 0);
            const dateIso = dateForIso.toISOString().split('T')[0]; // YYYY-MM-DD

            // Create standardized format matching Health Connect
            const formattedResult: StepsData = {
              date: displayDate,
              dateISO: dateIso,
              count: totalSteps,
              startTime: startDate.toISOString(),
              endTime: endDate.toISOString(),
              sources: Array.from(dataSources),
              recordCount: individualRecords.length,
              timestamps: timestamps.slice(0, 10),
              records: individualRecords,
            };

            setLoading(false);
            activeFetch.current = false;
            resolve([formattedResult]);
          });
        });
      } catch (err) {
        console.error('Failed to fetch steps data:', err);
        setError('Failed to fetch steps data');
        setLoading(false);
        activeFetch.current = false;
        return [];
      }
    },
    [isInitialized, hasPermissions, initialize, requestPermissions]
  );

  // Get steps data for the last week
  const getStepsForLastWeek = useCallback(async () => {
    if (!isIOS) return [];

    if (activeFetch.current) {
      return [];
    }

    activeFetch.current = true;

    if (!isInitialized || !hasPermissions) {
      const initialized = await initialize();
      if (initialized) {
        let hasPerms = await checkPermissions();
        if (!hasPerms) {
          hasPerms = await requestPermissions();
        }
        if (!hasPerms) {
          activeFetch.current = false;
          return [];
        }
      } else {
        activeFetch.current = false;
        return [];
      }
    }

    try {
      setLoading(true);

      // Process the last 7 days (including today)
      const now = new Date();
      const results: StepsData[] = [];

      for (let i = 0; i < 7; i++) {
        const endDate = new Date(now);
        endDate.setDate(now.getDate() - i);
        endDate.setHours(23, 59, 59, 999); // End of day

        const startDate = new Date(endDate);
        startDate.setHours(0, 0, 0, 0); // Start of day

        // Format dates for Health Kit
        const options = {
          date: startDate.toISOString(), // For single day total
          startDate: startDate.toISOString(), // For samples
          endDate: endDate.toISOString(),
          includeManuallyAdded: true,
        };

        // Get total steps for this specific day
        const stepCount = await new Promise<number>((resolve) => {
          AppleHealthKit.getStepCount(options, (err, results) => {
            if (err) {
              console.error('Error getting step count:', err);
              resolve(0);
              return;
            }
            resolve(results.value || 0);
          });
        });

        // Get step samples for detailed metadata
        const stepSamples = await new Promise<any[]>((resolve) => {
          AppleHealthKit.getDailyStepCountSamples(options, (err, results) => {
            if (err) {
              console.error('Error getting step samples:', err);
              resolve([]);
              return;
            }
            resolve(results || []);
          });
        });

        // Extract sources and create records
        const dataSources = new Set<string>();
        const individualRecords: StepRecord[] = [];
        const timestamps: number[] = [];

        if (stepSamples && Array.isArray(stepSamples)) {
          stepSamples.forEach((sample) => {
            if (sample.metadata && Array.isArray(sample.metadata)) {
              sample.metadata.forEach((meta: any) => {
                if (meta.sourceName) {
                  dataSources.add(meta.sourceName);
                }
              });
            }

            // Create a record for each sample
            individualRecords.push({
              count: sample.value || 0,
              startTime: sample.startDate,
              endTime: sample.endDate,
              dataOrigin:
                sample.metadata?.[0] &&
                typeof sample.metadata[0] === 'object' &&
                sample.metadata[0] !== null &&
                'sourceName' in sample.metadata[0]
                  ? (sample.metadata[0].sourceName as string)
                  : 'Apple Health',
              id: `${sample.startDate}-${sample.endDate}`,
            });

            if (sample.startDate) {
              timestamps.push(new Date(sample.startDate).getTime());
            }
          });
        }

        // Add formatted data for this day
        results.push({
          date: startDate.toLocaleDateString('en-US'),
          dateISO: startDate.toISOString().split('T')[0],
          count: stepCount,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          sources: Array.from(dataSources),
          recordCount: individualRecords.length,
          timestamps: timestamps.slice(0, 10),
          records: individualRecords,
        });
      }

      setStepsData(results);
      return results;
    } catch (error) {
      console.error('Error fetching steps for last week:', error);
      return [];
    } finally {
      setLoading(false);
      activeFetch.current = false;
    }
  }, [
    isInitialized,
    hasPermissions,
    initialize,
    checkPermissions,
    requestPermissions,
  ]);

  const setupAppleHealth = useCallback(async () => {
    if (setupCompleted.current) return true;

    const initialized = await initialize();
    if (initialized) {
      let hasPerms = await checkPermissions();
      if (!hasPerms) {
        hasPerms = await requestPermissions();
      }
      if (hasPerms) {
        await getStepsForLastWeek();
        setupCompleted.current = true;
        return true;
      }
    }
    return false;
  }, [initialize, checkPermissions, requestPermissions, getStepsForLastWeek]);

  // Run setup once on initialization
  useEffect(() => {
    if (isIOS && !setupCompleted.current) {
      setupAppleHealth();
    }
  }, [setupAppleHealth]);

  const refreshStepsData = useCallback(async () => {
    setupCompleted.current = false; // Reset to force refresh

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
      return getStepsForLastWeek();
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
