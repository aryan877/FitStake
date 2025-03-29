import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { StepRecord, StepsData } from '../types';

// Health Connect is only available on Android
const isAndroid = Platform.OS === 'android';

export const useHealthConnect = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [stepsData, setStepsData] = useState<StepsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setupCompleted = useRef(false);

  const initialize = useCallback(async () => {
    if (!isAndroid) return false;
    try {
      const { initialize: initHC } = await import(
        'react-native-health-connect'
      );
      const initialized = await initHC();
      setIsInitialized(initialized);
      return initialized;
    } catch (err) {
      setError('Failed to initialize Health Connect');
      return false;
    }
  }, []);

  const checkPermissions = useCallback(async () => {
    if (!isAndroid || !isInitialized) return false;
    try {
      const { getGrantedPermissions } = await import(
        'react-native-health-connect'
      );
      const permissions = await getGrantedPermissions();
      const hasStepsPermission = permissions.some(
        (permission) =>
          permission.recordType === 'Steps' && permission.accessType === 'read'
      );
      setHasPermissions(hasStepsPermission);
      return hasStepsPermission;
    } catch (err) {
      return false;
    }
  }, [isInitialized]);

  const requestPermissions = useCallback(async () => {
    if (!isAndroid || !isInitialized) return false;
    try {
      const { requestPermission } = await import('react-native-health-connect');
      const permissions = await requestPermission([
        { accessType: 'read', recordType: 'Steps' },
      ]);
      const granted = permissions.length > 0;
      setHasPermissions(granted);
      return granted;
    } catch (err) {
      setError('Failed to request permissions');
      return false;
    }
  }, [isInitialized]);

  const fetchStepsDataDirect = async (permissionsGranted: boolean) => {
    if (!isAndroid || !isInitialized || !permissionsGranted) return [];

    setLoading(true);
    setError(null);

    try {
      const { aggregateRecord, readRecords } = await import(
        'react-native-health-connect'
      );
      const results: StepsData[] = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const displayDate = date.toLocaleDateString();

        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        try {
          // Get aggregated steps for the day
          const aggregatedSteps = await aggregateRecord({
            recordType: 'Steps',
            timeRangeFilter: {
              operator: 'between',
              startTime: startDate.toISOString(),
              endTime: endDate.toISOString(),
            },
          });

          // Get records for collecting source information
          const stepsResponse = await readRecords('Steps', {
            timeRangeFilter: {
              operator: 'between',
              startTime: startDate.toISOString(),
              endTime: endDate.toISOString(),
            },
          });

          const totalSteps = aggregatedSteps.COUNT_TOTAL || 0;
          const dataSources = new Set<string>();
          const recordCount = stepsResponse?.records?.length || 0;

          // New: store individual records for enhanced verification
          const individualRecords: StepRecord[] = [];

          // Collect data sources to send to backend
          if (recordCount > 0) {
            stepsResponse.records.forEach((record) => {
              if (record.metadata?.dataOrigin) {
                dataSources.add(record.metadata.dataOrigin);
              }

              // Add each record as an individual entry
              individualRecords.push({
                count: record.count,
                startTime: record.startTime,
                endTime: record.endTime,
                recordingMethod: record.metadata?.recordingMethod,
                dataOrigin: record.metadata?.dataOrigin,
                id: record.metadata?.id,
                lastModifiedTime: record.metadata?.lastModifiedTime,
              });
            });
          }

          // Add enhanced data for backend verification
          results.push({
            date: displayDate,
            count: totalSteps,
            sources: Array.from(dataSources),
            recordCount,
            records: individualRecords,
          });
        } catch (dayErr) {
          console.error(`Error fetching steps for ${displayDate}:`, dayErr);
          results.push({
            date: displayDate,
            count: 0,
            sources: [],
            recordCount: 0,
            records: [],
          });
        }
      }

      setStepsData(results);
      setLoading(false);
      return results;
    } catch (err) {
      console.error('Failed to fetch steps data:', err);
      setError('Failed to fetch steps data');
      setLoading(false);
      return [];
    }
  };

  const fetchStepsData = useCallback(async () => {
    if (!isAndroid || !isInitialized || !hasPermissions) return [];
    return fetchStepsDataDirect(true);
  }, [isInitialized, hasPermissions]);

  // Fetch steps data for a specific date range
  const fetchStepsForDateRange = useCallback(
    async (startDate: Date, endDate: Date) => {
      if (!isAndroid) {
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
          console.error('Failed to initialize Health Connect:', err);
          return [];
        }
      }

      setLoading(true);
      setError(null);

      try {
        const { aggregateRecord, readRecords } = await import(
          'react-native-health-connect'
        );
        const results: StepsData[] = [];

        // Clone dates to avoid modifying the original
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Set time to beginning and end of day
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        // Calculate number of days in range
        const dayDiff = Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 3600 * 24)
        );

        // Process each day in parallel for better performance
        const promises = Array.from({ length: dayDiff + 1 }, async (_, i) => {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          const displayDate = date.toLocaleDateString();

          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);

          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);

          try {
            const [aggregatedSteps, stepsResponse] = await Promise.all([
              aggregateRecord({
                recordType: 'Steps',
                timeRangeFilter: {
                  operator: 'between',
                  startTime: dayStart.toISOString(),
                  endTime: dayEnd.toISOString(),
                },
              }),
              readRecords('Steps', {
                timeRangeFilter: {
                  operator: 'between',
                  startTime: dayStart.toISOString(),
                  endTime: dayEnd.toISOString(),
                },
              }),
            ]);

            const totalSteps = aggregatedSteps.COUNT_TOTAL || 0;
            const dataSources = new Set<string>();
            const recordCount = stepsResponse?.records?.length || 0;
            const timestamps: number[] = [];
            const individualRecords: StepRecord[] = [];

            if (recordCount > 0) {
              stepsResponse.records.forEach((record) => {
                if (record.metadata?.dataOrigin) {
                  dataSources.add(record.metadata.dataOrigin);
                }

                if (record.startTime) {
                  timestamps.push(new Date(record.startTime).getTime());
                }

                individualRecords.push({
                  count: record.count,
                  startTime: record.startTime,
                  endTime: record.endTime,
                  recordingMethod: record.metadata?.recordingMethod,
                  dataOrigin: record.metadata?.dataOrigin,
                  id: record.metadata?.id,
                  lastModifiedTime: record.metadata?.lastModifiedTime,
                });
              });
            }

            return {
              date: displayDate,
              count: totalSteps,
              sources: Array.from(dataSources),
              recordCount,
              timestamps: timestamps.slice(0, 10),
              records: individualRecords,
            };
          } catch (err) {
            console.error(`Error processing steps for ${displayDate}:`, err);
            return {
              date: displayDate,
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

  // Get steps data for the last week (for challenge progress tracking)
  const getStepsForLastWeek = useCallback(async () => {
    if (!isAndroid) return [];

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

    // Use the reliable date range function to get last 7 days
    const endDate = new Date(); // Now
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6); // Last 7 days (including today)

    // Call our more reliable function to fetch the data
    return fetchStepsForDateRange(startDate, endDate);
  }, [
    isInitialized,
    hasPermissions,
    initialize,
    checkPermissions,
    requestPermissions,
    fetchStepsForDateRange,
  ]);

  const setupHealthConnect = useCallback(async () => {
    if (setupCompleted.current) return;

    const initialized = await initialize();
    if (initialized) {
      let hasPerms = await checkPermissions();
      if (!hasPerms) {
        hasPerms = await requestPermissions();
      }
      if (hasPerms) {
        // Use the improved function for fetching data
        const endDate = new Date(); // Now
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 6); // Last 7 days (including today)

        await fetchStepsForDateRange(startDate, endDate);
        setupCompleted.current = true;
      }
    }
  }, [
    initialize,
    checkPermissions,
    requestPermissions,
    fetchStepsForDateRange,
  ]);

  useEffect(() => {
    if (isAndroid && !setupCompleted.current) {
      setupHealthConnect();
    }
  }, [setupHealthConnect]);

  const refreshStepsData = useCallback(async () => {
    setupCompleted.current = false;

    if (isInitialized) {
      let hasPerms = await checkPermissions();
      if (!hasPerms) {
        hasPerms = await requestPermissions();
      }
      if (hasPerms) {
        // Use the improved function for fetching data
        const endDate = new Date(); // Now
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 6); // Last 7 days (including today)

        return fetchStepsForDateRange(startDate, endDate);
      }
    } else {
      await setupHealthConnect();
    }
    return [];
  }, [
    isInitialized,
    checkPermissions,
    requestPermissions,
    setupHealthConnect,
    fetchStepsForDateRange,
  ]);

  return {
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
    setupHealthConnect,
    refreshStepsData,
    getStepsForLastWeek,
  };
};
