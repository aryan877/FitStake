import theme from '@/app/theme';
import { useHealth } from '@/hooks/useHealth';
import { Footprints, RefreshCw } from 'lucide-react-native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

// Helper function for date formatting - moved outside component
const formatDateString = (dateString: string) => {
  if (!dateString) return 'Unknown date';

  try {
    let date;

    // Try to parse the date in a consistent way
    if (dateString.includes('-') && dateString.length === 10) {
      // YYYY-MM-DD format (from ISO string)
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else if (dateString.includes('/')) {
      // MM/DD/YYYY format
      const parts = dateString.split('/');
      const month = parseInt(parts[0], 10) - 1; // Months are 0-indexed in JS Date
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      date = new Date(year, month, day);
    } else {
      // Any other format
      date = new Date(dateString);
    }

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date format:', dateString);
      return 'Unknown';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateDay = new Date(date);
    dateDay.setHours(0, 0, 0, 0);

    // Check if the date is today
    if (dateDay.getTime() === today.getTime()) {
      return 'Today';
    }

    // Check if the date is yesterday
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (dateDay.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }

    // Format the date as "MMM D" (e.g., "Jan 5")
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (error) {
    console.error('Error formatting date:', error, dateString);
    return 'Unknown';
  }
};

// Connection Component - Shown when not connected to health service
const ConnectionComponent = ({
  isIOS,
  setupHealth,
}: {
  isIOS: boolean;
  setupHealth: () => Promise<boolean | void>;
}) => {
  const healthServiceName = isIOS ? 'Apple Health' : 'Health Connect';

  return (
    <View style={styles.stepsCard}>
      <View style={styles.stepsCardHeader}>
        <Footprints color={colors.accent.primary} size={24} />
        <Text style={styles.stepsCardTitle}>Steps Data</Text>
      </View>
      <View style={styles.connectionContent}>
        <View style={styles.connectionAlertContent}>
          <Text style={styles.connectionAlertTitle}>
            Connect to {healthServiceName}
          </Text>
          <Text style={styles.connectionAlertText}>
            FitStake needs access to {healthServiceName} to track your steps.{' '}
            {isIOS
              ? 'Your fitness apps should be synced with Apple Health separately.'
              : 'Your fitness apps should be synced with Health Connect separately.'}
          </Text>
          <Pressable style={styles.connectionAlertButton} onPress={setupHealth}>
            <Text style={styles.connectionAlertButtonText}>Connect Now</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

// Loading Component
const LoadingComponent = () => (
  <View style={styles.stepsCard}>
    <View style={styles.stepsCardHeader}>
      <Footprints color={colors.accent.primary} size={24} />
      <Text style={styles.stepsCardTitle}>Steps Data</Text>
    </View>
    <ActivityIndicator
      color={colors.accent.primary}
      size="large"
      style={styles.loader}
    />
  </View>
);

// Error Component
const ErrorComponent = ({ errorMessage }: { errorMessage: string | null }) => (
  <View style={styles.stepsCard}>
    <View style={styles.stepsCardHeader}>
      <Footprints color={colors.accent.primary} size={24} />
      <Text style={styles.stepsCardTitle}>Steps Data</Text>
    </View>
    <Text style={styles.stepsCardError}>{errorMessage || 'Unknown error'}</Text>
  </View>
);

// Steps Data Component - Main component to show steps data
const StepsDataContent = ({
  processedStepsData,
  formattedSyncTime,
  handleRefresh,
  isRefreshing,
  spin,
}: {
  processedStepsData: any[];
  formattedSyncTime: string;
  handleRefresh: () => Promise<void>;
  isRefreshing: boolean;
  spin: any;
}) => {
  // Get today's data (first item in processed data)
  const todayData = processedStepsData[0];

  // Get recent history (up to 5 days)
  const recentHistory = processedStepsData.slice(0, 5);

  return (
    <View style={styles.stepsCardContainer}>
      {/* Today's Steps Highlight Card */}
      <View style={styles.todayStepsCard}>
        <View style={styles.todayStepsHeader}>
          <Text style={styles.todayStepsTitle}>Today's Steps</Text>
          <Footprints color={colors.accent.primary} size={28} />
        </View>
        <View style={styles.todayStepsContent}>
          <Text style={styles.todayStepsCount}>{todayData?.count || 0}</Text>
        </View>
      </View>

      {/* Weekly Steps History */}
      <View style={styles.stepsHistoryCard}>
        <View style={styles.stepsCardHeader}>
          <Text style={styles.stepsHistoryTitle}>Weekly History</Text>
          <Pressable
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <RefreshCw size={20} color={colors.accent.primary} />
            </Animated.View>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stepsHistoryScrollContent}
        >
          {recentHistory.map((item, index) => (
            <View key={index} style={styles.stepsDayCard}>
              <Text style={styles.stepsDayTitle}>{item.displayDate}</Text>
              <View style={styles.stepsIconContainer}>
                <Footprints
                  size={24}
                  color={
                    item.count > 0 ? colors.accent.primary : colors.gray[500]
                  }
                />
              </View>
              <Text style={styles.stepsDayCount}>{item.count}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Last sync indicator */}
        <View style={styles.lastSyncContainer}>
          <Text style={styles.lastSyncText}>
            Last synced: {formattedSyncTime}
          </Text>
        </View>
      </View>

      {/* Refresh Button */}
      <Pressable
        style={styles.refreshStepsButton}
        onPress={handleRefresh}
        disabled={isRefreshing}
      >
        <Text style={styles.refreshStepsButtonText}>
          {isRefreshing ? 'Refreshing...' : 'Refresh Steps Data'}
        </Text>
      </Pressable>
    </View>
  );
};

const StepsDataCard = () => {
  const {
    isAndroid,
    isIOS,
    stepsData,
    loading,
    error,
    hasPermissions,
    refreshStepsData,
    setupHealth,
  } = useHealth();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const spinValue = useRef(new Animated.Value(0)).current;

  // Add this ref to prevent multiple initialization attempts
  const initAttempted = useRef(false);

  // Modify the startSpinAnimation function to track the animation reference
  const startSpinAnimation = useCallback(() => {
    spinValue.setValue(0);
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return animation;
  }, [spinValue]);

  // Handle refreshing steps data - with improved animation handling
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return; // Prevent multiple refreshes

    try {
      setIsRefreshing(true);
      const animation = startSpinAnimation(); // Start and track the animation

      await refreshStepsData();
      setLastSyncTime(new Date()); // Update last sync time

      // Stop animation after data is loaded
      animation.stop();
    } catch (error) {
      console.error('Error refreshing steps data:', error);
    } finally {
      setIsRefreshing(false);
      // Make sure animation stops even if there's an error
      spinValue.stopAnimation();
    }
  }, [isRefreshing, refreshStepsData, startSpinAnimation]);

  // Initialize health service - add cleanup and prevent multiple calls
  useEffect(() => {
    let isMounted = true;
    // Track the animation reference properly
    let animationRef: Animated.CompositeAnimation | null = null;

    // Only attempt initialization once
    if (!initAttempted.current) {
      initAttempted.current = true;

      const initializeHealth = async () => {
        try {
          await setupHealth();
          if (isMounted) {
            setLastSyncTime(new Date()); // Set initial sync time
          }
        } catch (error) {
          console.error('Failed to initialize health service:', error);
        }
      };

      initializeHealth();
    }

    return () => {
      isMounted = false;
      // Stop any ongoing animations when component unmounts
      spinValue.stopAnimation();
    };
  }, [setupHealth]);

  // Process and normalize the steps data - called regardless of render path
  const processedStepsData = useMemo(() => {
    // If we don't have data yet, return empty array
    if (!stepsData || stepsData.length === 0) {
      return Array(7).fill({
        count: 0,
        displayDate: '',
        sources: [],
        records: [],
      });
    }

    // Create an array of the last 7 days
    const result = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day

    // Generate dates for the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0); // Ensure we're looking at start of day

      // Format date consistently for comparison
      const formattedDate = date.toLocaleDateString('en-US'); // MM/DD/YYYY
      const isoDate = date.toISOString().split('T')[0]; // YYYY-MM-DD

      // Find matching data for this date - prioritize matching by dateISO
      const matchingData = stepsData.find((item) => {
        // First try to match using the ISO date string if available (most reliable)
        if (item.dateISO && item.dateISO === isoDate) {
          return true;
        }

        // If no match by ISO, try to match by date string
        if (item.date && item.date === formattedDate) {
          return true;
        }

        // Last resort: Parse and compare dates
        try {
          // Only attempt to parse if we have a date value
          if (!item.date) return false;

          const itemDate = new Date(item.date);
          if (isNaN(itemDate.getTime())) return false;

          return (
            itemDate.getFullYear() === date.getFullYear() &&
            itemDate.getMonth() === date.getMonth() &&
            itemDate.getDate() === date.getDate()
          );
        } catch (e) {
          return false;
        }
      });

      result.push({
        date: formattedDate,
        displayDate: formatDateString(formattedDate),
        count: matchingData ? matchingData.count : 0,
        sources: matchingData?.sources || [],
        recordCount: matchingData?.recordCount || 0,
        records: matchingData?.records || [],
      });
    }

    return result;
  }, [stepsData]);

  // Format the last sync time - called regardless of render path
  const formattedSyncTime = useMemo(() => {
    return lastSyncTime
      ? lastSyncTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Never';
  }, [lastSyncTime]);

  // Show connection component if not connected
  if (!hasPermissions) {
    return <ConnectionComponent isIOS={isIOS} setupHealth={setupHealth} />;
  }

  // Loading state
  if (loading && !isRefreshing && !stepsData.length) {
    return <LoadingComponent />;
  }

  // Error state
  if (error) {
    return <ErrorComponent errorMessage={error} />;
  }

  // Connected with data
  return (
    <StepsDataContent
      processedStepsData={processedStepsData}
      formattedSyncTime={formattedSyncTime}
      handleRefresh={handleRefresh}
      isRefreshing={isRefreshing}
      spin={spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      })}
    />
  );
};

export default StepsDataCard;

const styles = StyleSheet.create({
  stepsCardContainer: {
    marginBottom: spacing.md,
  },
  stepsCard: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  stepsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  stepsCardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
    flex: 1,
    marginLeft: spacing.sm,
  },
  stepsCardSubtitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  stepsCardNote: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
  stepsCardError: {
    fontSize: fontSize.md,
    color: colors.accent.error,
    textAlign: 'center',
    padding: spacing.md,
  },
  loader: {
    paddingVertical: spacing.xl,
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: spacing.md,
  },
  connectionContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  connectionAlertContent: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.gray[700],
  },
  connectionAlertTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  connectionAlertText: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginBottom: spacing.md,
  },
  connectionAlertButton: {
    backgroundColor: colors.accent.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  connectionAlertButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  // Today's steps card
  todayStepsCard: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  todayStepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  todayStepsTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  todayStepsContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  todayStepsCount: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  // Steps history card
  stepsHistoryCard: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  stepsHistoryTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  stepsHistoryScrollContent: {
    paddingVertical: spacing.sm,
  },
  stepsDayCard: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minWidth: 100,
    marginRight: spacing.md,
    alignItems: 'center',
  },
  stepsDayTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[300],
    marginBottom: spacing.xs,
  },
  stepsIconContainer: {
    marginVertical: spacing.sm,
  },
  stepsDayCount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  // Last sync indicator
  lastSyncContainer: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  lastSyncText: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    fontStyle: 'italic',
  },
  // Refresh button
  refreshStepsButton: {
    backgroundColor: colors.accent.primary,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.sm,
  },
  refreshStepsButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  refreshButton: {
    padding: spacing.xs,
  },
});
