import theme from '@/app/theme';
import { UserStats } from '@/types/user';
import { Award, Flame, Target, Trophy, Users } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

interface StatsCardProps {
  stats: UserStats | null | undefined;
  badgesCount?: number;
}

const StatsCard = ({ stats, badgesCount = 0 }: StatsCardProps) => {
  if (!stats) {
    return (
      <View style={styles.statsCard}>
        <View style={styles.statsCardHeader}>
          <Target color={colors.accent.primary} size={24} />
          <Text style={styles.statsCardTitle}>Your Stats</Text>
        </View>
        <ActivityIndicator
          color={colors.accent.primary}
          size="large"
          style={styles.loader}
        />
      </View>
    );
  }

  // Use proper defaults and handle undefined values
  const challengesWon = stats.challengesCompleted || 0;
  const challengesJoined = stats.challengesJoined || 0;
  const challengesCreated = stats.challengesCreated || 0;

  const statItems = [
    {
      icon: <Trophy size={22} color={colors.accent.primary} />,
      count: challengesWon,
      label: 'Completed',
      color: colors.accent.primary,
    },
    {
      icon: <Users size={22} color={colors.accent.secondary} />,
      count: challengesJoined,
      label: 'Joined',
      color: colors.accent.secondary,
    },
    {
      icon: <Flame size={22} color="#FF6B6B" />,
      count: challengesCreated,
      label: 'Created',
      color: '#FF6B6B',
    },
    {
      icon: <Award size={22} color="#FFD700" />,
      count: badgesCount,
      label: 'Badges',
      color: '#FFD700',
    },
  ];

  return (
    <View style={styles.statsCard}>
      <View style={styles.statsCardHeader}>
        <Target color={colors.accent.primary} size={24} />
        <Text style={styles.statsCardTitle}>Your Stats</Text>
      </View>

      <View style={styles.statsGrid}>
        {statItems.map((item, index) => (
          <View key={index} style={styles.statItem}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${item.color}20` },
              ]}
            >
              {item.icon}
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statCount}>{item.count}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsCard: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statsCardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginLeft: spacing.sm,
  },
  loader: {
    marginVertical: spacing.md,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  statContent: {
    flex: 1,
  },
  statCount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[300],
    marginTop: 2,
  },
});

export default StatsCard;
