import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// Health Connect is only available on Android
const isAndroid = Platform.OS === 'android';

export interface StepsData {
  count: number;
  date: string;
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
      const { aggregateRecord } = await import('react-native-health-connect');
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
          const result = await aggregateRecord({
            recordType: 'Steps',
            timeRangeFilter: {
              operator: 'between',
              startTime: startDate.toISOString(),
              endTime: endDate.toISOString(),
            },
          });

          results.push({
            date: displayDate,
            count: result.COUNT_TOTAL,
          });
        } catch (dayErr) {
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
      setError('Failed to fetch steps data');
      setLoading(false);
      return [];
    }
  };

  const fetchStepsData = useCallback(async () => {
    if (!isAndroid || !isInitialized || !hasPermissions) return [];
    return fetchStepsDataDirect(true);
  }, [isInitialized, hasPermissions]);

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
    setupHealthConnect,
    refreshStepsData,
  };
};
