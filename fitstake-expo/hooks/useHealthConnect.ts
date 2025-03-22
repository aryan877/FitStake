import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { StepsData } from '../app/services/api';

// Health Connect is only available on Android
const isAndroid = Platform.OS === 'android';

export interface StepRecord {
  count: number;
  startTime: string;
  endTime: string;
  recordingMethod?: number;
  dataOrigin?: string;
  id?: string;
  lastModifiedTime?: string;
}

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

          console.log('=== HEALTH DATA BOUNDARY START ===');
          console.log('Steps response details:');
          console.log('- Page Token:', stepsResponse.pageToken);
          console.log('- Records count:', stepsResponse.records?.length || 0);
          console.log('- Records:');
          stepsResponse.records?.forEach((record, index) => {
            console.log(
              `  [${index}] Count: ${record.count}, Start: ${record.startTime}, End: ${record.endTime}`
            );
            console.log(
              `      Metadata:`,
              JSON.stringify(record.metadata, null, 2)
            );
          });
          console.log('=== HEALTH DATA BOUNDARY END ===');

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

          console.log(
            `[${displayDate}] Aggregated steps: ${totalSteps}, Records: ${recordCount}, Sources: ${Array.from(
              dataSources
            ).join(', ')}`
          );

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

    return fetchStepsDataDirect(true);
  }, [
    isInitialized,
    hasPermissions,
    initialize,
    checkPermissions,
    requestPermissions,
  ]);

  // Fetch steps data for a specific date range
  const fetchStepsForDateRange = useCallback(
    async (startDate: Date, endDate: Date) => {
      if (!isAndroid) {
        console.log('Health Connect is only available on Android');
        // For iOS or other platforms, return dummy data with empty verification
        const dayDiff = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
        );
        const results: StepsData[] = [];

        for (let i = 0; i <= dayDiff; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          results.push({
            date: date.toLocaleDateString(),
            count: 0,
            sources: [],
            recordCount: 0,
            timestamps: [],
            records: [],
          });
        }

        return results;
      }

      if (!isInitialized || !hasPermissions) {
        console.log('Health Connect not initialized or missing permissions');
        try {
          await initialize();
          await requestPermissions();
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

        console.log(
          `Fetching step data for ${
            dayDiff + 1
          } days from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`
        );

        // For each day in the range
        for (let i = 0; i <= dayDiff; i++) {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          const displayDate = date.toLocaleDateString();

          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);

          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);

          try {
            // Get aggregated steps for the day
            const aggregatedSteps = await aggregateRecord({
              recordType: 'Steps',
              timeRangeFilter: {
                operator: 'between',
                startTime: dayStart.toISOString(),
                endTime: dayEnd.toISOString(),
              },
            });

            // Get records for collecting source information
            const stepsResponse = await readRecords('Steps', {
              timeRangeFilter: {
                operator: 'between',
                startTime: dayStart.toISOString(),
                endTime: dayEnd.toISOString(),
              },
            });

            const totalSteps = aggregatedSteps.COUNT_TOTAL || 0;
            const dataSources = new Set<string>();
            const recordCount = stepsResponse?.records?.length || 0;
            const timestamps: number[] = [];

            // New: store individual records for enhanced verification
            const individualRecords: StepRecord[] = [];

            // Collect data sources and timestamps to send to backend for better verification
            if (recordCount > 0) {
              stepsResponse.records.forEach((record) => {
                if (record.metadata?.dataOrigin) {
                  dataSources.add(record.metadata.dataOrigin);
                }

                // Collect time points to detect distributed readings
                if (record.startTime) {
                  const timestamp = new Date(record.startTime).getTime();
                  timestamps.push(timestamp);
                }

                // Add each record as an individual entry for detailed verification
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

            // Sort timestamps for better analysis
            timestamps.sort();

            // Log data for each day
            console.log(
              `[${displayDate}] Steps: ${totalSteps}, Records: ${recordCount}, Sources: ${Array.from(
                dataSources
              ).join(', ')}`
            );

            // Add enhanced data for backend verification
            results.push({
              date: displayDate,
              count: totalSteps,
              sources: Array.from(dataSources),
              recordCount,
              timestamps:
                timestamps.length > 10 ? timestamps.slice(0, 10) : timestamps, // Limit timestamp data
              records: individualRecords,
            });
          } catch (dayErr) {
            console.error(`Error fetching steps for ${displayDate}:`, dayErr);
            results.push({
              date: displayDate,
              count: 0,
              sources: [],
              recordCount: 0,
              timestamps: [],
              records: [],
            });
          }
        }

        setStepsData(results);
        setLoading(false);
        return results;
      } catch (err) {
        console.error('Failed to fetch steps data for date range:', err);
        setError('Failed to fetch steps data for date range');
        setLoading(false);
        return [];
      }
    },
    [isInitialized, hasPermissions, initialize, requestPermissions]
  );

  const setupHealthConnect = useCallback(async () => {
    if (setupCompleted.current) return;

    const initialized = await initialize();
    if (initialized) {
      let hasPerms = await checkPermissions();
      if (!hasPerms) {
        hasPerms = await requestPermissions();
      }
      if (hasPerms) {
        await fetchStepsDataDirect(hasPerms);
        setupCompleted.current = true;
      }
    }
  }, [initialize, checkPermissions, requestPermissions]);

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
        return fetchStepsDataDirect(hasPerms);
      }
    } else {
      await setupHealthConnect();
    }
    return [];
  }, [isInitialized, hasPermissions, requestPermissions, setupHealthConnect]);

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
