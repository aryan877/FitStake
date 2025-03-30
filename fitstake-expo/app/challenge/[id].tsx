import { StepsData } from '@/types';
import { usePrivy } from '@privy-io/expo';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import { useChallenges } from '../../hooks/useChallenges';
import { useHealth } from '../../hooks/useHealth';
import { useSolanaWallet } from '../../hooks/useSolanaWallet';
import { ChallengeDetails, Participant } from '../../types/challenge';
import { ChallengeHeader } from '../components/challenge/ChallengeHeader';
import ChallengeOverview from '../components/challenge/ChallengeOverview';
import { ChallengeTabs } from '../components/challenge/ChallengeTabs';
import { CollapsibleDescription } from '../components/challenge/CollapsibleDescription';
import { JoinChallengeButton } from '../components/challenge/JoinChallengeButton';
import { LeaderboardList } from '../components/challenge/LeaderboardList';
import { ProgressCard } from '../components/challenge/ProgressCard';
import { StepHistoryCard } from '../components/challenge/StepHistoryCard';
import { authApi } from '../services/api';
import theme from '../theme';
import { formatCountdown, formatDate } from '../utils/dateFormatting';
import { showErrorToast, showSuccessToast } from '../utils/errorHandling';

const { colors, spacing } = theme;

export default function ChallengeDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = usePrivy();
  const { address: walletAddress, balance } = useSolanaWallet();
  const {
    joinChallenge,
    fetchChallengeById,
    submitHealthData: submitChallengeHealthData,
    claimReward,
  } = useChallenges();

  // State
  const [challenge, setChallenge] = useState<ChallengeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [joiningChallenge, setJoiningChallenge] = useState(false);
  const [claimingReward, setClaimingReward] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [personalProgress, setPersonalProgress] = useState(0);
  const [isParticipant, setIsParticipant] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'leaderboard'>(
    'details'
  );
  const [healthData, setHealthData] = useState<StepsData[]>([]);
  const [sortedParticipants, setSortedParticipants] = useState<Participant[]>(
    []
  );
  const [userParticipant, setUserParticipant] = useState<Participant | null>(
    null
  );
  const [currentTimeRemaining, setCurrentTimeRemaining] = useState<string>('');

  // Timer ref for cleanup
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    fetchStepsForDateRange,
    loading: healthDataLoading,
    getHealthProvider,
  } = useHealth();

  // Update time remaining
  const updateTimeRemaining = useCallback(() => {
    if (challenge) {
      setCurrentTimeRemaining(formatCountdown(challenge.endTime));
    }
  }, [challenge]);

  // Setup timer for live countdown
  useEffect(() => {
    // Initial update
    updateTimeRemaining();

    // Set up interval to update every second
    timerRef.current = setInterval(updateTimeRemaining, 1000);

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [updateTimeRemaining]);

  // Fetch challenge details
  const fetchChallengeDetails = useCallback(async () => {
    try {
      setLoading(true);
      if (!id) return;

      const challengeData = await fetchChallengeById(id as string);

      if (challengeData) {
        setChallenge(challengeData);

        // Update time remaining immediately
        setCurrentTimeRemaining(formatCountdown(challengeData.endTime));

        // Check if current user is a participant
        if (user) {
          const userProfile = await authApi.getUserProfile();
          const walletAddress = userProfile?.data?.walletAddress;

          if (walletAddress) {
            const participant = challengeData.participants.find(
              (p: Participant) => p.walletAddress === walletAddress
            );

            setIsParticipant(!!participant);
            setUserParticipant(participant || null);
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
    if (!challenge) return [];

    try {
      const startDate = new Date(challenge.startTime * 1000);
      const endDate = new Date(challenge.endTime * 1000);
      const now = new Date();

      // If challenge hasn't ended yet, use current date as end date
      const actualEndDate = now < endDate ? now : endDate;

      const stepsData = await fetchStepsForDateRange(startDate, actualEndDate);

      // Only set health data if we got valid data back and component is still mounted
      if (stepsData && Array.isArray(stepsData)) {
        setHealthData(stepsData);

        // Calculate total steps and progress
        const totalSteps = stepsData.reduce((sum, day) => sum + day.count, 0);
        const calculatedProgress = Math.min(
          1,
          totalSteps / challenge.goal.value
        );
        setPersonalProgress(calculatedProgress);
      }

      return stepsData;
    } catch (error) {
      console.error('Error fetching health data:', error);
      showErrorToast(error, 'Failed to fetch health data');
      return [];
    }
  }, [challenge, fetchStepsForDateRange]);

  // Sync health data with backend
  const syncHealthData = async () => {
    try {
      if (!challenge) {
        showErrorToast(null, 'Challenge information not available');
        return;
      }

      setSubmitting(true);
      // Fetch the latest health data and submit it
      const latestHealthData = await fetchHealthData();

      if (!latestHealthData || latestHealthData.length === 0) {
        showErrorToast(null, 'No step data available to submit');
        return;
      }

      const result = await submitChallengeHealthData(
        challenge.id,
        latestHealthData,
        challenge.goal.value,
        getHealthProvider()
      );

      if (result.success) {
        // Fetch only challenge data to update participant info
        const updatedChallenge = await fetchChallengeById(challenge.id);
        if (updatedChallenge) {
          setChallenge(updatedChallenge);

          // Check for current user's participant data
          if (user) {
            const userProfile = await authApi.getUserProfile();
            const walletAddress = userProfile?.data?.walletAddress;

            if (walletAddress) {
              const participant = updatedChallenge.participants.find(
                (p: Participant) => p.walletAddress === walletAddress
              );

              if (participant) {
                setPersonalProgress(participant.progress || 0);
                setUserParticipant(participant);
              }
            }
          }
        }

        // Show a more informative success message
        const totalSteps = latestHealthData.reduce(
          (sum, day) => sum + day.count,
          0
        );
        showSuccessToast(
          `Data submitted: ${totalSteps.toLocaleString()} steps (${Math.floor(
            result.progress || 0
          )}% complete)`
        );
      } else {
        throw new Error(result.error || 'Failed to sync health data');
      }
    } catch (error) {
      console.error('Error syncing health data:', error);
      showErrorToast(error, 'Failed to sync health data');
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

  // Handle claiming reward
  const handleClaimReward = async () => {
    if (!challenge) return;

    try {
      setClaimingReward(true);
      const success = await claimReward(challenge.challengeId);

      if (success) {
        showSuccessToast('Successfully claimed your reward!');
        await fetchChallengeDetails(); // Refresh data
      } else {
        throw new Error('Failed to claim reward');
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      showErrorToast(error, 'Failed to claim reward');
    } finally {
      setClaimingReward(false);
    }
  };

  // Add handler for copying challenge ID
  const handleCopyId = async () => {
    try {
      if (!challenge) return;

      await Clipboard.setStringAsync(challenge.challengeId);

      // Show different toast messages based on platform
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          'Challenge ID copied to clipboard',
          ToastAndroid.SHORT
        );
      } else {
        showSuccessToast('Challenge ID copied to clipboard');
      }
    } catch (error) {
      console.error('Failed to copy challenge ID:', error);
      showErrorToast(error, 'Failed to copy challenge ID');
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchChallengeDetails();
  }, [fetchChallengeDetails]);

  // Load health data when challenge details are loaded
  useEffect(() => {
    let mounted = true;

    if (challenge && isParticipant && !loading) {
      fetchHealthData().then((data) => {
        if (mounted && data) {
          setHealthData(data);
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, [challenge?.id, isParticipant, loading]);

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
        <ChallengeHeader
          title="Challenge Details"
          timeRemaining=""
          onBack={() => router.back()}
        />
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
        <ChallengeHeader
          title="Challenge Details"
          timeRemaining=""
          onBack={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Challenge not found</Text>
          <View style={styles.actionContainer}>
            <Text style={styles.actionText} onPress={() => router.back()}>
              Go Back
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const progressPercentage = Math.floor(personalProgress * 100);
  const isEnded = new Date() > new Date(challenge.endTime * 1000);

  // Check if user is eligible for reward
  const isEligibleForReward =
    challenge?.isCompleted &&
    userParticipant?.completed &&
    !userParticipant?.claimed;

  // Check if user failed the challenge
  const userFailedChallenge =
    challenge?.isCompleted && userParticipant && !userParticipant.completed;

  // Calculate total steps from health data
  const totalSteps = healthData.reduce((sum, day) => sum + day.count, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <ChallengeHeader
        title={challenge.title}
        timeRemaining={currentTimeRemaining}
        onBack={() => router.back()}
      />

      {/* Tabs */}
      <ChallengeTabs
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {/* Main Content */}
      {activeTab === 'details' ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
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
        >
          {/* Join Challenge Button - Show only if not participant and challenge not ended */}
          {!isParticipant && !isEnded && (
            <JoinChallengeButton
              onPress={handleJoinChallenge}
              isJoining={joiningChallenge}
            />
          )}

          {/* User Progress Card - Show only if user is a participant */}
          {isParticipant && (
            <ProgressCard
              progressPercentage={progressPercentage}
              totalSteps={totalSteps}
              goalSteps={challenge.goal.value}
              isCompleted={challenge.isCompleted}
              isEligibleForReward={!!isEligibleForReward}
              userFailedChallenge={!!userFailedChallenge}
              rewardClaimed={!!userParticipant?.claimed}
              onSyncSteps={syncHealthData}
              onRefreshData={fetchHealthData}
              onClaimReward={handleClaimReward}
              isSubmitting={submitting}
              isLoading={healthDataLoading}
              isClaimingReward={claimingReward}
            />
          )}

          {/* Challenge Overview Card */}
          <ChallengeOverview
            goalValue={challenge.goal.value}
            goalUnit={challenge.goal.unit}
            stakeAmount={formatSolAmount(challenge.stakeAmount)}
            solAmount={challenge.stakeAmount / LAMPORTS_PER_SOL}
            token={challenge.token}
            participantCount={challenge.participantCount}
            maxParticipants={challenge.maxParticipants}
            isCompleted={challenge.isCompleted}
            isActive={challenge.isActive}
            startDate={formatDate(challenge.startTime)}
            endDate={formatDate(challenge.endTime)}
            timeRemaining={currentTimeRemaining}
            isPublic={challenge.isPublic}
            onCopyId={handleCopyId}
            challengeId={challenge.challengeId}
          />

          {/* Description Card */}
          <CollapsibleDescription
            description={challenge.description}
            initiallyExpanded={false}
          />

          {/* Step History Card - Show only if user is a participant */}
          {isParticipant && (
            <StepHistoryCard
              stepsData={healthData}
              isLoading={healthDataLoading}
            />
          )}
        </ScrollView>
      ) : (
        <LeaderboardList
          participants={sortedParticipants}
          participantCount={challenge.participantCount}
          refreshing={refreshing}
          onRefresh={onRefresh}
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.gray[300],
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.accent.error,
    fontSize: 18,
    marginBottom: spacing.lg,
  },
  actionContainer: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  actionText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});
