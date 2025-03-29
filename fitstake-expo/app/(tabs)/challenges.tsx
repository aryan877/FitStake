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
import { formatCountdown } from '../utils/dateFormatting';
import { showErrorToast } from '../utils/errorHandling';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

export default function MyChallengesScreen() {
  const { user } = usePrivy();
  const router = useRouter();
  const [challenges, setChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    'ACTIVE' | 'COMPLETED' | 'FAILED' | undefined
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
    filter: 'ACTIVE' | 'COMPLETED' | 'FAILED' | undefined
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
    const statusBadge = item.completed
      ? 'Completed'
      : item.claimed
      ? 'Claimed'
      : 'In Progress';
    const statusColor = item.completed
      ? colors.accent.primary
      : item.claimed
      ? colors.accent.warning
      : colors.accent.primary;

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
      >
        <View style={styles.challengeHeader}>
          <Text style={styles.challengeTitle}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusBadge}</Text>
          </View>
        </View>

        <Text style={styles.challengeDescription}>{trimmedDescription}</Text>

        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            Progress: {progressPercentage}%
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage}%`,
                  backgroundColor: statusColor,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.challengeDetails}>
          <View style={styles.detailItem}>
            <Trophy size={16} color={colors.gray[400]} />
            <Text style={styles.detailText}>
              Goal: {item.goal.value.toLocaleString()} {item.goal.unit}
            </Text>
          </View>

          <View style={styles.stakeContainer}>
            <View style={styles.detailItem}>
              <Text style={styles.detailText}>
                Stake: {formatSolAmount(item.stakeAmount)} {item.token}
              </Text>
            </View>
            <SolanaPriceDisplay
              solAmount={solAmount}
              compact={true}
              variant="dark"
              showSolAmount={false}
            />
          </View>

          <Text style={styles.timeRemaining}>
            {formatCountdown(item.endTime)}
          </Text>
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
            activeFilter === 'COMPLETED' && styles.activeFilterButton,
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
          subtitle="Join challenges from the Challenges tab"
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
    paddingVertical: spacing.xs,
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
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  challengeTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
    flex: 1,
  },
  statusBadge: {
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  challengeDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[300],
    marginBottom: spacing.md,
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  progressText: {
    fontSize: fontSize.sm,
    color: colors.gray[300],
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  challengeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    color: colors.gray[300],
    fontSize: fontSize.xs,
  },
  timeRemaining: {
    color: colors.accent.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  stakeContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
});
