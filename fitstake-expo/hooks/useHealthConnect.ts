import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { StepsData } from '../app/services/api';

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
      const { readRecords } = await import('react-native-health-connect');
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
          // First read all steps records for the day
          const stepsResponse = await readRecords('Steps', {
            timeRangeFilter: {
              operator: 'between',
              startTime: startDate.toISOString(),
              endTime: endDate.toISOString(),
            },
          });

          // Filter only automatically recorded data (RECORDING_METHOD_AUTOMATICALLY_RECORDED = 2)
          let totalSteps = 0;

          console.log(
            `[${displayDate}] Total records: ${
              stepsResponse?.records?.length || 0
            }`
          );

          if (stepsResponse && stepsResponse.records) {
            // Log the first record to see its structure
            if (stepsResponse.records.length > 0) {
              console.log(
                'Sample record structure:',
                JSON.stringify(stepsResponse.records[0], null, 2)
              );
            }

            // Filter records where recording method is "automatically recorded" (value 2)
            const automaticRecords = stepsResponse.records.filter(
              (record) =>
                record.metadata && record.metadata.recordingMethod === 2
            );

            console.log(
              `[${displayDate}] Automatic records: ${automaticRecords.length}`
            );

            // Sum up the steps from automatically recorded data
            automaticRecords.forEach((record) => {
              if (record.count) {
                totalSteps += record.count;
              }
            });

            // Also calculate total for comparison
            let allStepsTotal = 0;
            stepsResponse.records.forEach((record) => {
              if (record.count) {
                allStepsTotal += record.count;
              }
            });

            console.log(
              `[${displayDate}] Automatic steps: ${totalSteps}, All steps: ${allStepsTotal}`
            );
          }

          results.push({
            date: displayDate,
            count: totalSteps,
          });
        } catch (dayErr) {
          console.error(`Error fetching steps for ${displayDate}:`, dayErr);
          results.push({
            date: displayDate,
            count: 0,
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
      if (!isAndroid || !isInitialized || !hasPermissions) return [];

      setLoading(true);
      setError(null);

      try {
        const { readRecords } = await import('react-native-health-connect');
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
            // Read steps for this day
            const stepsResponse = await readRecords('Steps', {
              timeRangeFilter: {
                operator: 'between',
                startTime: dayStart.toISOString(),
                endTime: dayEnd.toISOString(),
              },
            });

            // Filter automatic records and sum steps
            let totalSteps = 0;

            if (stepsResponse && stepsResponse.records) {
              const automaticRecords = stepsResponse.records.filter(
                (record) =>
                  record.metadata && record.metadata.recordingMethod === 2
              );

              automaticRecords.forEach((record) => {
                if (record.count) {
                  totalSteps += record.count;
                }
              });
            }

            results.push({
              date: displayDate,
              count: totalSteps,
            });
          } catch (dayErr) {
            console.error(`Error fetching steps for ${displayDate}:`, dayErr);
            results.push({
              date: displayDate,
              count: 0,
            });
          }
        }

        setLoading(false);
        return results;
      } catch (err) {
        console.error('Failed to fetch steps data for date range:', err);
        setError('Failed to fetch steps data for date range');
        setLoading(false);
        return [];
      }
    },
    [isInitialized, hasPermissions]
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
