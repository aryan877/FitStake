import theme from '@/app/theme';
import { useHealthConnect } from '@/hooks/useHealthConnect';
import dayjs from 'dayjs';
import { ActivitySquare, Footprints } from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

const formatDateString = (dateString: string) => {
  if (!dateString) {
    return 'Unknown date';
  }

  try {
    let date;

    // Check if the date is in MM/DD/YYYY format
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const month = parseInt(parts[0]) - 1; // Months are 0-indexed in JS Date
        const day = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        date = dayjs(new Date(year, month, day));
      } else {
        date = dayjs(dateString);
      }
    } else {
      date = dayjs(dateString);
    }

    // Check if the date is valid
    if (!date.isValid()) {
      console.log('Invalid date format:', dateString);
      return 'Unknown date';
    }

    const today = dayjs();

    // Check if the date is today
    if (date.isSame(today, 'day')) {
      return 'Today';
    }
    // Check if the date is yesterday
    else if (date.isSame(today.subtract(1, 'day'), 'day')) {
      return 'Yesterday';
    }

    // Format the date as a concise fallback - just month and day
    return date.format('MMM D');
  } catch (error) {
    console.error('Error formatting date:', error, dateString);
    return 'Unknown date';
  }
};

const StepsDataCard = () => {
  const {
    isAndroid,
    stepsData,
    loading,
    error,
    hasPermissions,
    refreshStepsData,
    setupHealthConnect,
  } = useHealthConnect();

  const ConnectionComponent = () => {
    const handleConnect = () => {
      console.log('Connecting to Health Connect...');
      setupHealthConnect();
    };

    return (
      <View style={styles.stepsCard}>
        <View style={styles.stepsCardHeader}>
          <Footprints color={colors.accent.primary} size={24} />
          <Text style={styles.stepsCardTitle}>Steps Data</Text>
        </View>
        <View style={styles.connectionContent}>
          <View style={styles.connectionAlertContent}>
            <Text style={styles.connectionAlertTitle}>
              Connect to Health Connect
            </Text>
            <Text style={styles.connectionAlertText}>
              FitStake needs access to Health Connect to track your steps. Your
              fitness apps should be synced with Health Connect separately.
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
    if (isAndroid) {
      setupHealthConnect();
    }
  }, [isAndroid, setupHealthConnect]);

  // iOS specific view
  if (!isAndroid) {
    return (
      <View style={styles.stepsCard}>
        <View style={styles.stepsCardHeader}>
          <Footprints color={colors.accent.primary} size={24} />
          <Text style={styles.stepsCardTitle}>Steps Data</Text>
        </View>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.stepsCardSubtitle}>Apple Health Integration</Text>
          <Text style={styles.stepsCardNote}>Coming soon to iOS devices</Text>
        </View>
      </View>
    );
  }

  // Show connection component if not connected
  if (!hasPermissions) {
    return <ConnectionComponent />;
  }

  // Loading state
  if (loading) {
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

  // Sort steps data to ensure most recent dates are first
  // We need to handle different date formats correctly
  const sortedStepsData = [...stepsData].sort((a, b) => {
    // Try to parse the dates correctly
    let dateA, dateB;

    try {
      // Handle MM/DD/YYYY format
      if (a.date.includes('/')) {
        const parts = a.date.split('/');
        if (parts.length === 3) {
          const month = parseInt(parts[0]) - 1;
          const day = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          dateA = new Date(year, month, day);
        } else {
          dateA = new Date(a.date);
        }
      } else {
        dateA = new Date(a.date);
      }

      if (b.date.includes('/')) {
        const parts = b.date.split('/');
        if (parts.length === 3) {
          const month = parseInt(parts[0]) - 1;
          const day = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          dateB = new Date(year, month, day);
        } else {
          dateB = new Date(b.date);
        }
      } else {
        dateB = new Date(b.date);
      }

      // If date parsing fails, use the original date strings
      if (isNaN(dateA.getTime())) dateA = new Date(a.date);
      if (isNaN(dateB.getTime())) dateB = new Date(b.date);

      // Sort in descending order (most recent first)
      return dateB.getTime() - dateA.getTime();
    } catch (error) {
      console.error('Error sorting dates:', error);
      // Fallback to string comparison if parsing fails
      return b.date.localeCompare(a.date);
    }
  });

  // Get today's data (should be the first item in the sorted array)
  const todayData = sortedStepsData.length > 0 ? sortedStepsData[0] : null;

  // Connected with data
  return (
    <View style={styles.stepsCardContainer}>
      {/* Today's Steps Highlight Card */}
      {todayData && (
        <View style={styles.todayStepsCard}>
          <View style={styles.todayStepsHeader}>
            <Text style={styles.todayStepsTitle}>Today's Steps</Text>
            <Footprints color={colors.accent.primary} size={28} />
          </View>
          <View style={styles.todayStepsContent}>
            <Text style={styles.todayStepsCount}>{todayData.count}</Text>
          </View>
        </View>
      )}

      {/* Weekly Steps History */}
      <View style={styles.stepsHistoryCard}>
        <View style={styles.stepsCardHeader}>
          <Text style={styles.stepsHistoryTitle}>Weekly History</Text>
        </View>

        {sortedStepsData.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <ActivitySquare color={colors.gray[400]} size={40} />
            <Text style={styles.stepsCardSubtitle}>
              No steps data available
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsScrollContainer}
          >
            {sortedStepsData.map((data, index) => (
              <View
                key={index}
                style={[
                  styles.stepsDayCard,
                  index === 0 && styles.firstStepsDayCard,
                  index === sortedStepsData.length - 1 &&
                    styles.lastStepsDayCard,
                ]}
              >
                <Text style={styles.stepsDate}>
                  {formatDateString(data.date)}
                </Text>
                <View style={styles.stepsCountContainer}>
                  <Footprints
                    size={20}
                    color={
                      data.count > 0 ? colors.accent.primary : colors.gray[600]
                    }
                  />
                  <Text style={styles.stepsCountText}>{data.count}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <Pressable style={styles.actionButton} onPress={() => refreshStepsData()}>
        <Text style={styles.actionButtonText}>Refresh Steps Data</Text>
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
    marginBottom: spacing.sm,
  },
  stepsCardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginLeft: spacing.sm,
  },
  stepsHistoryTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  stepsCardSubtitle: {
    fontSize: fontSize.md,
    color: colors.gray[300],
    marginTop: spacing.sm,
  },
  stepsCardError: {
    fontSize: fontSize.md,
    color: colors.accent.error,
    marginTop: spacing.sm,
  },
  stepsCardNote: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginTop: spacing.xs,
  },
  loader: {
    marginVertical: spacing.md,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  connectionContent: {
    padding: spacing.md,
  },
  connectionAlertContent: {
    flex: 1,
  },
  connectionAlertTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  connectionAlertText: {
    fontSize: fontSize.sm,
    color: colors.gray[300],
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  connectionAlertButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  connectionAlertButtonText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  todayStepsCard: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  todayStepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  todayStepsTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  todayStepsContent: {
    alignItems: 'center',
  },
  todayStepsCount: {
    fontSize: 42,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  stepsHistoryCard: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardsScrollContainer: {
    paddingVertical: spacing.sm,
  },
  stepsDayCard: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    width: 110,
    alignItems: 'center',
  },
  firstStepsDayCard: {
    marginLeft: 0,
  },
  lastStepsDayCard: {
    marginRight: 0,
  },
  stepsDate: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[300],
    marginBottom: spacing.sm,
  },
  stepsCountContainer: {
    alignItems: 'center',
  },
  stepsCountText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginTop: spacing.sm,
  },
  actionButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.md,
  },
});

export default StepsDataCard;
