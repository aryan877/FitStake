import theme from '@/app/theme';
import { useHealth } from '@/hooks/useHealth';
import { Footprints, RefreshCw } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

// Helper function for date formatting
const formatDateString = (dateString: string) => {
  if (!dateString) return 'Unknown date';

  try {
    // Try to parse the date (support both ISO and MM/DD/YYYY format)
    let date: Date;

    if (dateString.includes('-') && dateString.length === 10) {
      // YYYY-MM-DD format (from dateISO)
      date = new Date(dateString);
    } else if (dateString.includes('/')) {
      // MM/DD/YYYY format
      const parts = dateString.split('/');
      date = new Date(
        parseInt(parts[2], 10),
        parseInt(parts[0], 10) - 1,
        parseInt(parts[1], 10)
      );
    } else {
      // Any other format
      date = new Date(dateString);
    }

    // Check if the date is valid
    if (isNaN(date.getTime())) {
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
  stepsData,
  formattedSyncTime,
  handleRefresh,
  isRefreshing,
  spin,
}: {
  stepsData: any[];
  formattedSyncTime: string;
  handleRefresh: () => Promise<void>;
  isRefreshing: boolean;
  spin: any;
}) => {
  // Get today's data (first item in stepsData)
  const todayData = stepsData.length > 0 ? stepsData[0] : { count: 0 };

  // Get recent history (up to 5 days)
  const recentHistory = stepsData.slice(0, 5).map((item) => ({
    ...item,
    displayDate: formatDateString(item.dateISO || item.date),
  }));

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
  const initAttempted = useRef(false);

  // Animation for refresh icon
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

  // Handle refreshing steps data
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return; // Prevent multiple refreshes

    try {
      setIsRefreshing(true);
      const animation = startSpinAnimation();

      await refreshStepsData();
      setLastSyncTime(new Date());

      // Stop animation after data is loaded
      animation.stop();
    } catch (error) {
      console.error('Error refreshing steps data:', error);
    } finally {
      setIsRefreshing(false);
      spinValue.stopAnimation();
    }
  }, [isRefreshing, refreshStepsData, startSpinAnimation]);

  // Initialize health service
  useEffect(() => {
    let isMounted = true;

    if (!initAttempted.current) {
      initAttempted.current = true;

      const initializeHealth = async () => {
        try {
          await setupHealth();
          if (isMounted) {
            setLastSyncTime(new Date());
          }
        } catch (error) {
          console.error('Failed to initialize health service:', error);
        }
      };

      initializeHealth();
    }

    return () => {
      isMounted = false;
      spinValue.stopAnimation();
    };
  }, [setupHealth]);

  // Format the last sync time
  const formattedSyncTime = lastSyncTime
    ? lastSyncTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Never';

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
      stepsData={stepsData}
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
