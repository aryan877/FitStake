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

  // Fetch steps data for a specific date-time range
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

        // Use the exact time boundaries provided
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Get steps for the exact time range specified
        const [aggregatedSteps, stepsResponse] = await Promise.all([
          aggregateRecord({
            recordType: 'Steps',
            timeRangeFilter: {
              operator: 'between',
              startTime: start.toISOString(),
              endTime: end.toISOString(),
            },
          }),
          readRecords('Steps', {
            timeRangeFilter: {
              operator: 'between',
              startTime: start.toISOString(),
              endTime: end.toISOString(),
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

        // Create a display date format that shows the time range
        const formatDateTime = (date: Date) => {
          return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}`;
        };

        const displayDate = `${formatDateTime(start)} - ${formatDateTime(end)}`;

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

    try {
      setLoading(true);

      // Get steps for each day in the last week individually
      const now = new Date();
      const results: StepsData[] = [];

      // Process the last 7 days (including today)
      for (let i = 0; i < 7; i++) {
        const endDate = new Date(now);
        endDate.setDate(now.getDate() - i);
        endDate.setHours(23, 59, 59, 999); // End of day

        const startDate = new Date(endDate);
        startDate.setHours(0, 0, 0, 0); // Start of day

        // Get steps for this specific day
        const dayData = await fetchStepsForDateRange(startDate, endDate);

        if (dayData && dayData.length > 0) {
          // Update the date ISO to just the date part for easier matching
          const dayRecord = {
            ...dayData[0],
            dateISO: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
            date: startDate.toLocaleDateString('en-US'), // MM/DD/YYYY format
          };
          results.push(dayRecord);
        } else {
          // Add empty record for this day
          results.push({
            date: startDate.toLocaleDateString('en-US'),
            dateISO: startDate.toISOString().split('T')[0],
            count: 0,
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
            sources: [],
            recordCount: 0,
            timestamps: [],
            records: [],
          });
        }
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
        await getStepsForLastWeek();
        setupCompleted.current = true;
      }
    }
  }, [initialize, checkPermissions, requestPermissions, getStepsForLastWeek]);

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
        return getStepsForLastWeek();
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
    getStepsForLastWeek,
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
    fetchStepsForDateRange,
    setupHealthConnect,
    refreshStepsData,
    getStepsForLastWeek,
  };
};
