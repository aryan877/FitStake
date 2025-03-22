import theme from '@/app/theme';
import { Participant } from '@/types';
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { LeaderboardItem } from './LeaderboardItem';

const { colors, spacing, borderRadius, fontSize, fontWeight } = theme;

interface LeaderboardListProps {
  participants: Participant[];
  participantCount: number;
  refreshing: boolean;
  onRefresh: () => void;
}

export const LeaderboardList = ({
  participants,
  participantCount,
  refreshing,
  onRefresh,
}: LeaderboardListProps) => {
  return (
    <FlatList
      data={participants}
      keyExtractor={(item, index) => `${item.walletAddress}-${index}`}
      renderItem={({ item, index }) => (
        <LeaderboardItem
          rank={index + 1}
          walletAddress={item.walletAddress}
          progress={item.progress || 0}
          stepsCount={
            item.healthData
              ? item.healthData.reduce((sum, day) => sum + day.steps, 0)
              : 0
          }
          isCompleted={!!item.completed}
        />
      )}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.accent.primary]}
          tintColor={colors.accent.primary}
          progressBackgroundColor={colors.gray[800]}
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Challenge Leaderboard</Text>
          <Text style={styles.subtitle}>
            {participantCount} participant{participantCount !== 1 ? 's' : ''}
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No participants yet</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
  emptyContainer: {
    backgroundColor: colors.gray[900],
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  emptyText: {
    color: colors.gray[400],
    fontSize: fontSize.md,
  },
});

export default LeaderboardList;
