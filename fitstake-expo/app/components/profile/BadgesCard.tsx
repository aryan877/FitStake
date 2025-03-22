import theme from '@/app/theme';
import { Badge } from '@/types/user';
import dayjs from 'dayjs';
import { Award, Crown, Footprints, Medal, Trophy } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

interface BadgeWithDetails extends Badge {
  earnedAt: Date;
}

interface BadgesCardProps {
  badges: BadgeWithDetails[] | null | undefined;
}

const getTierColor = (tier: string): string => {
  switch (tier) {
    case 'bronze':
      return '#cd7f32';
    case 'silver':
      return '#c0c0c0';
    case 'gold':
      return '#ffd700';
    case 'platinum':
      return '#e5e4e2';
    default:
      return '#c0c0c0';
  }
};

// Format date to a readable string
const formatBadgeDate = (date: Date): string => {
  try {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Unknown';
    }

    const badgeDate = dayjs(date);
    const today = dayjs();

    if (badgeDate.isSame(today, 'day')) {
      return 'Today';
    } else if (badgeDate.isSame(today.subtract(1, 'day'), 'day')) {
      return 'Yesterday';
    }

    // Use more concise date format without year
    return badgeDate.format('MMM D');
  } catch (error) {
    console.error('Error formatting badge date:', error);
    return 'Unknown';
  }
};

// Get the appropriate icon component based on badge id
const BadgeIcon = ({ id, color }: { id: string; color: string }) => {
  // Default size for all icons
  const size = 24;

  if (id.startsWith('step_')) {
    return <Footprints size={size} color={color} />;
  } else if (id === 'challenge_joiner') {
    return <Trophy size={size} color={color} />;
  } else if (id === 'challenge_winner') {
    return <Medal size={size} color={color} />;
  } else if (id === 'challenge_master') {
    return <Award size={size} color={color} />;
  } else if (id === 'challenge_creator') {
    return <Crown size={size} color={color} />;
  }

  // Default icon if none match
  return <Award size={size} color={color} />;
};

const BadgesCard = ({ badges }: BadgesCardProps) => {
  if (!badges || badges.length === 0) {
    return (
      <View style={styles.badgesCard}>
        <Text style={styles.badgesCardTitle}>Badges</Text>
        <Text style={styles.badgesCardSubtitle}>
          Complete challenges to earn badges
        </Text>
      </View>
    );
  }

  // Sort badges by date (newest first)
  const sortedBadges = [...badges].sort((a, b) => {
    try {
      const dateA = new Date(a.earnedAt);
      const dateB = new Date(b.earnedAt);
      return dateB.getTime() - dateA.getTime();
    } catch (error) {
      return 0;
    }
  });

  // Group badges by category
  const badgesByCategory = sortedBadges.reduce(
    (acc: Record<string, BadgeWithDetails[]>, badge) => {
      const category = badge.category || 'challenges';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(badge);
      return acc;
    },
    {}
  );

  return (
    <View style={styles.badgesCard}>
      <Text style={styles.badgesCardTitle}>Your Badges</Text>
      {Object.entries(badgesByCategory).map(([category, categoryBadges]) => (
        <View key={category} style={styles.badgeCategory}>
          <Text style={styles.badgeCategoryTitle}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.badgeScroll}
            contentContainerStyle={styles.badgeScrollContent}
          >
            {categoryBadges.map((badge) => (
              <View key={badge.id} style={styles.badgeItem}>
                <View
                  style={[
                    styles.badgeCircle,
                    { borderColor: getTierColor(badge.tier) },
                  ]}
                >
                  <BadgeIcon id={badge.id} color={getTierColor(badge.tier)} />
                </View>
                <Text style={styles.badgeName}>{badge.name}</Text>
                <Text style={styles.badgeDate}>
                  {formatBadgeDate(badge.earnedAt)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  badgesCard: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  badgesCardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
    color: colors.white,
  },
  badgesCardSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginBottom: spacing.sm,
  },
  badgeCategory: {
    marginBottom: spacing.md,
  },
  badgeCategoryTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    color: colors.white,
  },
  badgeScroll: {
    flexDirection: 'row',
  },
  badgeScrollContent: {
    paddingVertical: spacing.xs,
  },
  badgeItem: {
    alignItems: 'center',
    marginRight: spacing.sm,
    width: 100,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
  },
  badgeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    backgroundColor: colors.gray[900],
  },
  badgeName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    color: colors.white,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  badgeDate: {
    fontSize: 10,
    color: colors.gray[400],
    marginTop: spacing.xs,
  },
});

export default BadgesCard;
