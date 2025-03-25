import theme from '@/app/theme';
import { useHealth } from '@/hooks/useHealth';
import { Footprints, RefreshCw } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
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

// Helper function to format date consistently
const formatDateString = (dateString: string) => {
  if (!dateString) {
    return 'Unknown date';
  }

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

// Helper function to compare if two dates represent the same day
const isSameDay = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Improved date parsing that handles different formats reliably
const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;

  try {
    let date: Date;

    // ISO format (YYYY-MM-DD)
    if (dateString.includes('-') && dateString.length === 10) {
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day);
    }
    // MM/DD/YYYY format
    else if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const month = parseInt(parts[0], 10) - 1; // Months are 0-indexed in JS Date
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        date = new Date(year, month, day);
      } else {
        date = new Date(dateString);
      }
    }
    // ISO string with time
    else if (dateString.includes('T')) {
      date = new Date(dateString);
    }
    // Generic date parsing
    else {
      date = new Date(dateString);
    }

    // Normalize to midnight
    date.setHours(0, 0, 0, 0);

    // Validate date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date format:', dateString);
      return null;
    }

    return date;
  } catch (e) {
    console.error('Error parsing date:', e, dateString);
    return null;
  }
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

  // Create the rotation animation
  const startSpinAnimation = () => {
    spinValue.setValue(0);
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  // Stop the animation
  const stopSpinAnimation = () => {
    spinValue.stopAnimation();
  };

  // Create the spinning effect style
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Handle refreshing steps data
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      startSpinAnimation(); // Start the animation
      await refreshStepsData();
      setLastSyncTime(new Date()); // Update last sync time
    } catch (error) {
      console.error('Error refreshing steps data:', error);
    } finally {
      setIsRefreshing(false);
      stopSpinAnimation(); // Stop the animation
    }
  };

  const ConnectionComponent = () => {
    const handleConnect = () => {
      console.log(
        `Connecting to ${isIOS ? 'Apple Health' : 'Health Connect'}...`
      );
      setupHealth();
    };

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
            <Pressable
              style={styles.connectionAlertButton}
              onPress={handleConnect}
            >
              <Text style={styles.connectionAlertButtonText}>Connect Now</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  useEffect(() => {
    const initializeHealth = async () => {
      await setupHealth();
      setLastSyncTime(new Date()); // Set initial sync time
    };

    initializeHealth();
  }, []);

  // Platform-specific view for unavailable health services
  if ((isAndroid && !isAndroid) || (isIOS && !isIOS)) {
    return (
      <View style={styles.stepsCard}>
        <View style={styles.stepsCardHeader}>
          <Footprints color={colors.accent.primary} size={24} />
          <Text style={styles.stepsCardTitle}>Steps Data</Text>
        </View>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.stepsCardSubtitle}>
            {isIOS ? 'Apple Health' : 'Health Connect'} Integration
          </Text>
          <Text style={styles.stepsCardNote}>
            Coming soon to {isIOS ? 'iOS' : 'Android'} devices
          </Text>
        </View>
      </View>
    );
  }

  // Show connection component if not connected
  if (!hasPermissions) {
    return <ConnectionComponent />;
  }

  // Loading state
  if (loading && !isRefreshing && !stepsData.length) {
    return (
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
  }

  // Error state
  if (error) {
    return (
      <View style={styles.stepsCard}>
        <View style={styles.stepsCardHeader}>
          <Footprints color={colors.accent.primary} size={24} />
          <Text style={styles.stepsCardTitle}>Steps Data</Text>
        </View>
        <Text style={styles.stepsCardError}>{error}</Text>
      </View>
    );
  }

  // Process and normalize the steps data
  const processStepsData = () => {
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

      // Find matching data for this date - try both date formats for reliability
      const matchingData = stepsData.find((item) => {
        try {
          // First try to match using the ISO date string if available
          if (item.dateISO && item.dateISO === isoDate) {
            return true;
          }

          // Then try to parse the date from stepsData
          const itemDate = parseDate(item.date);
          if (!itemDate) return false;

          // Compare dates (only year, month, day)
          return isSameDay(itemDate, date);
        } catch (e) {
          console.error('Error comparing dates:', e);
          return false;
        }
      });

      result.push({
        date: formattedDate,
        displayDate: formatDateString(formattedDate),
        count: matchingData ? matchingData.count : 0,
        // Keep necessary properties for backend verification
        sources: matchingData?.sources || [],
        recordCount: matchingData?.recordCount || 0,
        records: matchingData?.records || [],
      });
    }

    return result;
  };

  const processedStepsData = processStepsData();

  // Get today's data (first item in processed data)
  const todayData = processedStepsData[0];

  // Get recent history (up to 5 days)
  const recentHistory = processedStepsData.slice(0, 5);

  // Format the last sync time
  const formattedSyncTime = lastSyncTime
    ? lastSyncTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Never';

  // Connected with data
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

export default StepsDataCard;
