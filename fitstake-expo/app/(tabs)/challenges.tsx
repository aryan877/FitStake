import { UserChallenge } from '@/types';
import { usePrivy } from '@privy-io/expo';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useRouter } from 'expo-router';
import { Activity, Trophy } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import EmptyState from '../components/EmptyState';
import SolanaPriceDisplay from '../components/SolanaPriceDisplay';
import { challengeApi } from '../services/api';
import theme from '../theme';
import { formatTimeDisplay } from '../utils/dateFormatting';
import { showErrorToast } from '../utils/errorHandling';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows, cards } =
  theme;

export default function MyChallengesScreen() {
  const { user } = usePrivy();
  const router = useRouter();
  const [challenges, setChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    'ACTIVE' | 'COMPLETED' | 'FAILED' | 'UPCOMING' | undefined
  >('ACTIVE');

  const fetchUserChallenges = async (status?: string) => {
    try {
      if (!user) {
        Alert.alert(
          'Authentication Required',
          'Please log in to view your challenges.'
        );
        setLoading(false);
        return;
      }

      const params = status ? { status } : {};
      const response = await challengeApi.getUserChallenges(params);

      if (response && response.data && response.data.challenges) {
        // Fetch progress for each challenge
        const challengesWithProgress = await Promise.all(
          response.data.challenges.map(async (challenge: any) => {
            try {
              const progressResponse = await challengeApi.getProgress(
                challenge.id
              );
              const progress = progressResponse.data || {
                progress: 0,
                completed: false,
                claimed: false,
              };

              return {
                ...challenge,
                progress: progress.progress,
                completed: progress.completed,
                claimed: progress.claimed,
              };
            } catch (err) {
              console.error(
                `Error fetching progress for challenge ${challenge.id}:`,
                err
              );
              return {
                ...challenge,
                progress: 0,
                completed: false,
                claimed: false,
              };
            }
          })
        );

        setChallenges(challengesWithProgress);
      } else {
        setChallenges([]);
      }
    } catch (err) {
      console.error('Error fetching user challenges:', err);
      showErrorToast(err, 'Failed to load your challenges');
      setChallenges([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserChallenges(activeFilter);
  }, [user, activeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserChallenges(activeFilter);
  };

  const handleFilterChange = (
    filter: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'UPCOMING' | undefined
  ) => {
    setActiveFilter(filter);
    setLoading(true);
  };

  const formatSolAmount = (lamports: number) => {
    return (lamports / LAMPORTS_PER_SOL).toFixed(2);
  };

  const renderChallengeItem = ({ item }: { item: UserChallenge }) => {
    const progressPercentage = Math.min(
      100,
      Math.max(0, Math.floor(item.progress * 100))
    );

    // Determine if challenge is upcoming by checking startTime
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const isUpcoming = item.startTime > currentTime;

    // Set status badge based on challenge state
    const statusBadge = isUpcoming
      ? 'Upcoming'
      : item.completed
      ? 'Completed'
      : item.claimed
      ? 'Claimed'
      : 'In Progress';

    // Set colors based on challenge status
    const statusColor = isUpcoming
      ? colors.accent.info
      : item.completed
      ? colors.accent.success
      : item.claimed
      ? colors.accent.warning
      : colors.accent.primary;

    // Set background color for status badge
    const statusBgColor = isUpcoming
      ? colors.status.upcoming || 'rgba(0, 191, 255, 0.1)' // Fallback light blue bg for upcoming
      : item.completed
      ? colors.status.completed
      : item.claimed
      ? colors.status.active
      : colors.status.active;

    // Trim long descriptions
    const descriptionCharLimit = 120;
    const trimmedDescription =
      item.description.length > descriptionCharLimit
        ? `${item.description.substring(0, descriptionCharLimit)}...`
        : item.description;

    // Calculate SOL amount in decimal
    const solAmount = item.stakeAmount / LAMPORTS_PER_SOL;

    return (
      <Pressable
        style={styles.challengeCard}
        onPress={() => router.push(`/challenge/${item.id}`)}
        android_ripple={{ color: 'transparent' }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.challengeTitle}>{item.title}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusBgColor, borderColor: statusColor },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusBadge}
            </Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.challengeDescription}>{trimmedDescription}</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressText}>Progress</Text>
              <Text style={[styles.progressPercentage, { color: statusColor }]}>
                {isUpcoming ? 'Not started' : `${progressPercentage}%`}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: isUpcoming ? '0%' : `${progressPercentage}%`,
                    backgroundColor: statusColor,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoSection}>
            <View style={styles.iconLabelGroup}>
              <Trophy size={14} color={statusColor} />
              <Text style={styles.infoLabel}>Goal</Text>
            </View>
            <Text style={styles.infoValue}>
              {item.goal.value.toLocaleString()} {item.goal.unit}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoSection}>
            <View style={styles.iconLabelGroup}>
              <Text style={styles.infoLabel}>Stake</Text>
            </View>
            <View style={styles.stakeContainer}>
              <Text style={styles.infoValue}>
                {formatSolAmount(item.stakeAmount)} {item.token}
              </Text>
              <SolanaPriceDisplay
                solAmount={solAmount}
                compact={true}
                variant="dark"
                showSolAmount={false}
              />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoSection}>
            <View style={styles.iconLabelGroup}>
              <Text style={styles.infoLabel}>Time</Text>
            </View>
            <Text style={[styles.timeValue, { color: statusColor }]}>
              {formatTimeDisplay(item.startTime, item.endTime)}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Challenges</Text>
        <Text style={styles.subtitle}>Track your active challenges</Text>
      </View>

      <View style={styles.filtersContainer}>
        <Pressable
          style={[
            styles.filterButton,
            activeFilter === 'ACTIVE' && styles.activeFilterButton,
          ]}
          onPress={() => handleFilterChange('ACTIVE')}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === 'ACTIVE' && styles.activeFilterText,
            ]}
          >
            Active
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.filterButton,
            activeFilter === 'UPCOMING' && styles.activeFilterButton,
            activeFilter === 'UPCOMING' && {
              backgroundColor: colors.accent.info,
            },
          ]}
          onPress={() => handleFilterChange('UPCOMING')}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === 'UPCOMING' && styles.activeFilterText,
            ]}
          >
            Upcoming
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.filterButton,
            activeFilter === 'COMPLETED' && styles.activeFilterButton,
            activeFilter === 'COMPLETED' && {
              backgroundColor: colors.accent.success,
            },
          ]}
          onPress={() => handleFilterChange('COMPLETED')}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === 'COMPLETED' && styles.activeFilterText,
            ]}
          >
            Completed
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.filterButton,
            activeFilter === 'FAILED' && styles.activeFilterButton,
            activeFilter === 'FAILED' && {
              backgroundColor: colors.accent.error,
            },
          ]}
          onPress={() => handleFilterChange('FAILED')}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === 'FAILED' && styles.activeFilterText,
            ]}
          >
            Failed
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>Loading your challenges...</Text>
        </View>
      ) : challenges.length === 0 ? (
        <EmptyState
          icon={<Activity color={colors.gray[400]} size={48} />}
          title={`No ${activeFilter?.toLowerCase() || ''} challenges found`}
          subtitle={
            activeFilter === 'UPCOMING'
              ? "You don't have any upcoming challenges yet"
              : 'Join challenges from the Explore tab'
          }
        />
      ) : (
        <FlatList
          data={challenges}
          renderItem={renderChallengeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.accent.primary]}
              tintColor={colors.accent.primary}
              progressBackgroundColor={colors.gray[800]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    padding: spacing.md,
    paddingTop: spacing.xxl + spacing.xl,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.gray[400],
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  filterButton: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    backgroundColor: colors.gray[800],
  },
  activeFilterButton: {
    backgroundColor: colors.accent.primary,
  },
  filterText: {
    color: colors.gray[300],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  activeFilterText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.gray[300],
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.md,
    paddingTop: spacing.xs,
  },
  challengeCard: {
    ...cards.standard,
    marginBottom: spacing.md,
    backgroundColor: colors.surface.card,
  },
  cardHeader: {
    ...cards.header,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  contentContainer: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  challengeTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
    lineHeight: 24,
  },
  statusBadge: {
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 90,
    alignItems: 'center',
    borderWidth: 1,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  challengeDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[300],
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  progressContainer: {
    marginBottom: spacing.xs,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressText: {
    fontSize: fontSize.sm,
    color: colors.gray[300],
    fontWeight: fontWeight.medium,
  },
  progressPercentage: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  infoSection: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    gap: 4,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: colors.white,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  timeValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    height: '70%',
    marginHorizontal: spacing.xs,
  },
  stakeContainer: {
    alignItems: 'center',
  },
});
