import theme from '@/app/theme';
import { Trophy } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

// Medal colors for top 3 ranks
const MEDAL_COLORS = {
  GOLD: '#FFD700',
  SILVER: '#C0C0C0',
  BRONZE: '#CD7F32',
};

interface LeaderboardItemProps {
  rank: number;
  walletAddress: string;
  progress: number;
  stepsCount: number;
  isCompleted: boolean;
}

export const LeaderboardItem = ({
  rank,
  walletAddress,
  progress,
  stepsCount,
  isCompleted,
}: LeaderboardItemProps) => {
  // Format wallet address to show only first 6 and last 4 characters
  const formattedAddress = `${walletAddress.substring(
    0,
    6
  )}...${walletAddress.substring(walletAddress.length - 4)}`;

  // Get rank medal color for top 3 positions
  const getRankBgColor = () => {
    if (rank === 1) return MEDAL_COLORS.GOLD;
    if (rank === 2) return MEDAL_COLORS.SILVER;
    if (rank === 3) return MEDAL_COLORS.BRONZE;
    return colors.gray[800];
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.rankContainer,
          rank <= 3 && styles.topRankContainer,
          { backgroundColor: getRankBgColor() },
        ]}
      >
        <Text style={styles.rankText}>{rank}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.addressText}>{formattedAddress}</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.floor(progress * 100)}%`,
                  backgroundColor:
                    progress >= 1
                      ? colors.accent.primary
                      : colors.accent.secondary,
                },
              ]}
            />
          </View>
          <Text style={styles.stepsText}>
            {stepsCount.toLocaleString()} steps
          </Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.progressText}>{Math.floor(progress * 100)}%</Text>
        {isCompleted && (
          <View style={styles.trophyBadge}>
            <Trophy size={12} color={colors.black} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  rankContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[800],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  topRankContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  rankText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  infoContainer: {
    flex: 1,
  },
  addressText: {
    color: colors.white,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  progressContainer: {
    flexDirection: 'column',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  stepsText: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    color: colors.accent.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginLeft: spacing.md,
  },
  trophyBadge: {
    backgroundColor: colors.accent.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
});

export default LeaderboardItem;
