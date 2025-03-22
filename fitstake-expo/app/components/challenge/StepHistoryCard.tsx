import theme from '@/app/theme';
import { StepsData } from '@/types';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

interface StepHistoryCardProps {
  stepsData: StepsData[];
  isLoading: boolean;
}

export const StepHistoryCard = ({
  stepsData,
  isLoading,
}: StepHistoryCardProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Step History</Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent.primary} />
        </View>
      ) : stepsData.length > 0 ? (
        stepsData.map((item) => (
          <View key={item.date} style={styles.historyItem}>
            <Text style={styles.dateText}>{item.date}</Text>
            <Text style={styles.stepsText}>
              {item.count.toLocaleString()} steps
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No step data available</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  dateText: {
    fontSize: fontSize.sm,
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  stepsText: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
  emptyContainer: {
    padding: spacing.md,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.gray[400],
    fontSize: fontSize.sm,
  },
});

export default StepHistoryCard;
