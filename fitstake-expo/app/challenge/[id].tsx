import { usePrivy } from '@privy-io/expo';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, ChevronUp, Trophy } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useChallenges } from '../../hooks/useChallenges';
import { useHealthConnect } from '../../hooks/useHealthConnect';
import { useSolanaWallet } from '../../hooks/useSolanaWallet';
import type { StepsData } from '../services/api';
import { authApi } from '../services/api';
import theme from '../theme';
import { formatCountdown, formatDate } from '../utils/dateFormatting';
import { showErrorToast, showSuccessToast } from '../utils/errorHandling';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

interface Participant {
  walletAddress: string;
  did?: string;
  stakeAmount: number;
  completed: boolean;
  claimed: boolean;
  joinedAt: Date;
  healthData?: {
    date: string;
    steps: number;
    lastUpdated: Date;
  }[];
  progress?: number;
}

interface ChallengeDetails {
  id: string;
  title: string;
  description: string;
  goal: {
    value: number;
    unit: string;
  };
  stakeAmount: number;
  token: string;
  startTime: number;
  endTime: number;
  participants: Participant[];
  participantCount: number;
  isActive: boolean;
  isCompleted: boolean;
}

export default function ChallengeDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = usePrivy();
  const { address: walletAddress, balance } = useSolanaWallet();
  const {
    joinChallenge,
    fetchChallengeById,
    submitHealthData: submitChallengeHealthData,
  } = useChallenges();
  const [challenge, setChallenge] = useState<ChallengeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [joiningChallenge, setJoiningChallenge] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [personalProgress, setPersonalProgress] = useState(0);
  const [isParticipant, setIsParticipant] = useState(false);
  const [expandDescription, setExpandDescription] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'leaderboard'>(
    'details'
  );
  const [healthData, setHealthData] = useState<StepsData[]>([]);
  const [sortedParticipants, setSortedParticipants] = useState<Participant[]>(
    []
  );

  const { fetchStepsForDateRange, loading: healthDataLoading } =
    useHealthConnect();

  // Medal colors for top 3 ranks
  const MEDAL_COLORS = {
    GOLD: '#FFD700',
    SILVER: '#C0C0C0',
    BRONZE: '#CD7F32',
  };

  // Fetch challenge details
  const fetchChallengeDetails = useCallback(async () => {
    try {
      setLoading(true);
      if (!id) return;

      const challengeData = await fetchChallengeById(id as string);

      if (challengeData) {
        setChallenge(challengeData);

        // Check if current user is a participant
        if (user) {
          const userProfile = await authApi.getUserProfile();
          const walletAddress = userProfile?.data?.walletAddress;

          if (walletAddress) {
            const participant = challengeData.participants.find(
              (p: Participant) => p.walletAddress === walletAddress
            );

            setIsParticipant(!!participant);
            if (participant) {
              setPersonalProgress(participant.progress || 0);
            }
          }
        }

        // Sort participants by progress
        const sorted = [...challengeData.participants].sort((a, b) => {
          return (b.progress || 0) - (a.progress || 0);
        });
        setSortedParticipants(sorted);
      }
    } catch (error) {
      console.error('Error fetching challenge details:', error);
      showErrorToast(error, 'Failed to load challenge details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, user, fetchChallengeById]);

  // Fetch user's health data for this challenge
  const fetchHealthData = useCallback(async () => {
    if (!challenge) return;

    try {
      const startDate = new Date(challenge.startTime * 1000);
      const endDate = new Date(challenge.endTime * 1000);
      const now = new Date();

      // If challenge hasn't ended yet, use current date as end date
      const actualEndDate = now < endDate ? now : endDate;

      const stepsData = await fetchStepsForDateRange(startDate, actualEndDate);
      setHealthData(stepsData);

      // Calculate total steps and progress
      const totalSteps = stepsData.reduce((sum, day) => sum + day.count, 0);
      const calculatedProgress = Math.min(1, totalSteps / challenge.goal.value);
      setPersonalProgress(calculatedProgress);

      return stepsData;
    } catch (error) {
      console.error('Error fetching health data:', error);
      return [];
    }
  }, [challenge, fetchStepsForDateRange]);

  // Submit health data to backend
  const submitStepData = async () => {
    if (!challenge || !healthData.length) return;

    try {
      setSubmitting(true);
      const latestHealthData = await fetchHealthData();

      if (!latestHealthData || latestHealthData.length === 0) {
        showErrorToast(null, 'No step data available to submit');
        return;
      }

      const result = await submitChallengeHealthData(
        challenge.id,
        latestHealthData,
        challenge.goal.value
      );

      if (result.success) {
        await fetchChallengeDetails();
        showSuccessToast('Step data submitted successfully');
      } else {
        throw new Error(result.error || 'Failed to submit step data');
      }
    } catch (error) {
      console.error('Error submitting step data:', error);
      showErrorToast(error, 'Failed to submit step data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinChallenge = async () => {
    try {
      if (!user) {
        Alert.alert(
          'Authentication Required',
          'Please log in to join a challenge.'
        );
        return;
      }

      if (!walletAddress) {
        Alert.alert(
          'Wallet Required',
          'Your wallet address is not available. Please check your connection.'
        );
        return;
      }

      if (!challenge) return;

      setJoiningChallenge(true);

      // Check if user is already a participant
      if (isParticipant) {
        showErrorToast(
          new Error('Already joined'),
          'You are already a participant in this challenge'
        );
        setJoiningChallenge(false);
        return;
      }

      // Check if user has sufficient balance
      const requiredBalance = challenge.stakeAmount / LAMPORTS_PER_SOL;
      if (balance !== null && balance < requiredBalance) {
        Alert.alert(
          'Insufficient Balance',
          `You need at least ${requiredBalance} SOL to join this challenge. Your balance: ${balance.toFixed(
            4
          )} SOL.`
        );
        setJoiningChallenge(false);
        return;
      }

      const success = await joinChallenge(challenge.id);

      if (success) {
        showSuccessToast('You have successfully joined the challenge!');
        setIsParticipant(true);
        const updatedChallenge = await fetchChallengeById(challenge.id);

        if (updatedChallenge) {
          setChallenge(updatedChallenge);
          const sorted = [...updatedChallenge.participants].sort((a, b) => {
            return (b.progress || 0) - (a.progress || 0);
          });
          setSortedParticipants(sorted);
        }

        fetchHealthData();
      } else {
        throw new Error('Failed to join challenge');
      }
    } catch (err) {
      console.error('Error joining challenge:', err);
      showErrorToast(err, 'Failed to join the challenge');
    } finally {
      setJoiningChallenge(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchChallengeDetails();
  }, [fetchChallengeDetails]);

  // Load health data when challenge details are loaded
  useEffect(() => {
    if (challenge && isParticipant) {
      fetchHealthData();
    }
  }, [challenge, isParticipant, fetchHealthData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChallengeDetails();

    if (isParticipant) {
      await fetchHealthData();
    }

    setRefreshing(false);
  };

  const formatSolAmount = (lamports: number) => {
    return (lamports / LAMPORTS_PER_SOL).toFixed(2);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Challenge Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>Loading challenge details...</Text>
        </View>
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Challenge Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Challenge not found</Text>
          <Pressable style={styles.actionButton} onPress={() => router.back()}>
            <Text style={styles.actionButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const progressPercentage = Math.floor(personalProgress * 100);
  const isEnded = new Date() > new Date(challenge.endTime * 1000);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {challenge.title}
        </Text>
        <View style={styles.timeRemainingContainer}>
          <Text style={styles.timeRemaining}>
            {formatCountdown(challenge.endTime)}
          </Text>
        </View>
      </View>

      {/* Main Challenge Info */}
      <View style={styles.challengeInfoCard}>
        {/* Join Challenge Button - Prominently displayed at top */}
        {!isParticipant && !isEnded && (
          <Pressable
            style={[
              styles.joinButton,
              joiningChallenge && styles.disabledButton,
            ]}
            onPress={handleJoinChallenge}
            disabled={joiningChallenge}
          >
            {joiningChallenge ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.joinButtonText}>Join Challenge</Text>
            )}
          </Pressable>
        )}

        {/* Participant Progress */}
        {isParticipant && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <Text style={styles.progressPercentage}>
                {progressPercentage}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor:
                      progressPercentage >= 100
                        ? colors.accent.primary
                        : colors.accent.secondary,
                  },
                ]}
              />
            </View>

            {/* Submit Step Data Button */}
            {!challenge.isCompleted && (
              <Pressable
                style={[
                  styles.submitButton,
                  (submitting || healthDataLoading) && styles.disabledButton,
                ]}
                onPress={submitStepData}
                disabled={submitting || healthDataLoading}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Step Data</Text>
                )}
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[
            styles.tabButton,
            activeTab === 'details' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('details')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'details' && styles.activeTabText,
            ]}
          >
            Details
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.tabButton,
            activeTab === 'leaderboard' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'leaderboard' && styles.activeTabText,
            ]}
          >
            Leaderboard
          </Text>
        </Pressable>
      </View>

      {/* Tab Content */}
      {activeTab === 'details' ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.accent.primary]}
              tintColor={colors.accent.primary}
              progressBackgroundColor={colors.gray[800]}
            />
          }
        >
          {/* Description */}
          <View style={styles.cardContainer}>
            <Text style={styles.cardTitle}>About Challenge</Text>
            <Text style={styles.descriptionText}>
              {expandDescription || challenge.description.length <= 150
                ? challenge.description
                : `${challenge.description.substring(0, 150)}...`}
            </Text>
            {challenge.description.length > 150 && (
              <Pressable
                style={styles.expandButton}
                onPress={() => setExpandDescription(!expandDescription)}
              >
                <Text style={styles.expandButtonText}>
                  {expandDescription ? 'Show Less' : 'Read More'}
                </Text>
                {expandDescription ? (
                  <ChevronUp size={16} color={colors.accent.primary} />
                ) : (
                  <ChevronDown size={16} color={colors.accent.primary} />
                )}
              </Pressable>
            )}
          </View>

          {/* Challenge Metrics - New section */}
          <View style={styles.cardContainer}>
            <Text style={styles.cardTitle}>Challenge Metrics</Text>
            <View style={styles.metricsContainer}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Start Date</Text>
                <Text style={styles.metricValue}>
                  {formatDate(challenge.startTime)}
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>End Date</Text>
                <Text style={styles.metricValue}>
                  {formatDate(challenge.endTime)}
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Goal</Text>
                <Text style={styles.metricValue}>
                  {challenge.goal.value.toLocaleString()} {challenge.goal.unit}
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Stake Amount</Text>
                <Text style={styles.metricValue}>
                  {formatSolAmount(challenge.stakeAmount)} {challenge.token}
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Participants</Text>
                <Text style={styles.metricValue}>
                  {challenge.participantCount}
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Status</Text>
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: challenge.isCompleted
                          ? colors.accent.warning
                          : challenge.isActive
                          ? colors.accent.primary
                          : colors.gray[400],
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.metricValue,
                      {
                        color: challenge.isCompleted
                          ? colors.accent.warning
                          : challenge.isActive
                          ? colors.accent.primary
                          : colors.gray[400],
                      },
                    ]}
                  >
                    {challenge.isCompleted
                      ? 'Completed'
                      : challenge.isActive
                      ? 'Active'
                      : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Step History for Participants */}
          {isParticipant && (
            <View style={styles.cardContainer}>
              <Text style={styles.cardTitle}>Step History</Text>
              {healthDataLoading ? (
                <ActivityIndicator size="small" color={colors.accent.primary} />
              ) : healthData.length > 0 ? (
                healthData.map((item) => (
                  <View key={item.date} style={styles.dailyProgressItem}>
                    <Text style={styles.dateText}>{item.date}</Text>
                    <Text style={styles.stepsCount}>
                      {item.count.toLocaleString()} steps
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyListContainer}>
                  <Text style={styles.emptyListText}>
                    No step data available
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={sortedParticipants}
          keyExtractor={(item, index) => `${item.walletAddress}-${index}`}
          renderItem={({ item, index }) => (
            <View style={styles.leaderboardItem}>
              <View
                style={[
                  styles.rankContainer,
                  index < 3 ? styles.topRankContainer : null,
                  index === 0
                    ? { backgroundColor: MEDAL_COLORS.GOLD }
                    : index === 1
                    ? { backgroundColor: MEDAL_COLORS.SILVER }
                    : index === 2
                    ? { backgroundColor: MEDAL_COLORS.BRONZE }
                    : null,
                ]}
              >
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.participantInfo}>
                <Text style={styles.participantAddress}>
                  {item.walletAddress.substring(0, 6)}...
                  {item.walletAddress.substring(item.walletAddress.length - 4)}
                </Text>
                <View style={styles.progressInfo}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.floor((item.progress || 0) * 100)}%`,
                          backgroundColor:
                            (item.progress || 0) >= 1
                              ? colors.accent.primary
                              : colors.accent.secondary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.stepsCount}>
                    {item.healthData &&
                      item.healthData
                        .reduce((sum, day) => sum + day.steps, 0)
                        .toLocaleString()}{' '}
                    steps
                  </Text>
                </View>
              </View>
              <View style={styles.participantProgressContainer}>
                <Text style={styles.participantProgress}>
                  {Math.floor((item.progress || 0) * 100)}%
                </Text>
                {item.completed && (
                  <View style={styles.completedBadge}>
                    <Trophy size={12} color={colors.black} />
                  </View>
                )}
              </View>
            </View>
          )}
          contentContainerStyle={styles.scrollViewContent}
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
            <View style={styles.leaderboardHeader}>
              <Text style={styles.leaderboardTitle}>Challenge Leaderboard</Text>
              <Text style={styles.leaderboardSubtitle}>
                {challenge.participantCount} participant
                {challenge.participantCount !== 1 ? 's' : ''}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Text style={styles.emptyListText}>No participants yet</Text>
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray[900],
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  backButton: {
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeRemainingContainer: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  timeRemaining: {
    fontSize: fontSize.sm,
    color: colors.accent.primary,
    fontWeight: fontWeight.medium,
  },
  challengeInfoCard: {
    backgroundColor: colors.gray[900],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  joinButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  joinButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  progressSection: {
    marginTop: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.white,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressPercentage: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.accent.primary,
  },
  submitButton: {
    backgroundColor: colors.accent.secondary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[800],
    backgroundColor: colors.gray[900],
    justifyContent: 'center',
  },
  tabButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginHorizontal: spacing.md,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.accent.primary,
  },
  tabButtonText: {
    fontSize: fontSize.md,
    color: colors.gray[400],
    textAlign: 'center',
  },
  activeTabText: {
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  cardContainer: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  descriptionText: {
    fontSize: fontSize.md,
    color: colors.gray[300],
    lineHeight: fontSize.md * 1.4,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  expandButtonText: {
    color: colors.accent.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginRight: spacing.xs,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
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
  rankText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  participantInfo: {
    flex: 1,
  },
  participantAddress: {
    color: colors.white,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  participantProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantProgress: {
    color: colors.accent.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginLeft: spacing.md,
  },
  dailyProgressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  dateText: {
    color: colors.gray[300],
    fontSize: fontSize.sm,
  },
  stepsCount: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: 2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.gray[300],
    fontSize: fontSize.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.accent.error,
    fontSize: fontSize.lg,
    marginBottom: spacing.lg,
  },
  emptyListContainer: {
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.md,
  },
  emptyListText: {
    color: colors.gray[400],
    fontSize: fontSize.sm,
  },
  actionButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  metricsContainer: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[700],
  },
  metricLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    fontWeight: fontWeight.medium,
  },
  metricValue: {
    fontSize: fontSize.md,
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  leaderboardHeader: {
    marginBottom: spacing.lg,
  },
  leaderboardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  leaderboardSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
  topRankContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  progressInfo: {
    flexDirection: 'column',
  },
  completedBadge: {
    backgroundColor: colors.accent.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
});
