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
import {
  formatDate,
  formatTimeDisplay,
  hasStarted,
} from '../utils/dateFormatting';
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
  const [challengeHasStarted, setChallengeHasStarted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    fetchStepsForDateRange,
    loading: healthDataLoading,
    getHealthProvider,
    setupHealth,
  } = useHealth();

  // Update time remaining
  const updateTimeRemaining = useCallback(() => {
    if (challenge) {
      setCurrentTimeRemaining(
        formatTimeDisplay(challenge.startTime, challenge.endTime)
      );

      // Update hasStarted status
      setChallengeHasStarted(hasStarted(challenge.startTime));
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
        setCurrentTimeRemaining(
          formatTimeDisplay(challengeData.startTime, challengeData.endTime)
        );

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

              // If user is a participant and there's progress but no health data
              // make sure to fetch the latest health data to sync with progress
              if (
                participant.progress > 0 &&
                (!healthData || healthData.length === 0)
              ) {
                initialDataFetchCompleted.current = false; // Reset to trigger health data fetch
              }
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

  // Add this flag to prevent redundant data fetching
  const isFetchingHealthData = useRef(false);

  const fetchHealthData = useCallback(async () => {
    if (isFetchingHealthData.current) {
      return [];
    }

    if (!challenge) return [];

    try {
      isFetchingHealthData.current = true;

      const challengeStartTime = new Date(challenge.startTime * 1000);
      const challengeEndTime = new Date(challenge.endTime * 1000);
      const now = new Date();

      // If challenge hasn't ended yet, use current date as end boundary
      const actualEndDate = now < challengeEndTime ? now : challengeEndTime;

      // Respect the exact challenge time boundaries, regardless of day boundaries
      const data = await fetchStepsForDateRange(
        challengeStartTime,
        actualEndDate
      );

      if (data && Array.isArray(data) && data.length > 0) {
        // Calculate total steps and progress
        const totalSteps = data.reduce((sum, day) => sum + day.count, 0);
        const calculatedProgress = Math.min(
          1,
          totalSteps / challenge.goal.value
        );
        setPersonalProgress(calculatedProgress);
        return data;
      }

      return [];
    } catch (error) {
      console.error('Error fetching health data:', error);
      showErrorToast(error, 'Failed to fetch health data');
      return [];
    } finally {
      isFetchingHealthData.current = false;
    }
  }, [challenge, fetchStepsForDateRange]);

  const initialDataFetchCompleted = useRef(false);

  useEffect(() => {
    // Only fetch once when challenge and participant status are confirmed
    if (
      challenge &&
      isParticipant &&
      !initialDataFetchCompleted.current &&
      !isFetchingHealthData.current
    ) {
      initialDataFetchCompleted.current = true;

      // Initialize and request permissions if needed
      setupHealth?.().then(() => {
        fetchHealthData().then((data) => {
          if (data && data.length > 0) {
            setHealthData(data);

            // Log the data summary
            const totalSteps = data.reduce((sum, day) => sum + day.count, 0);
            console.log(
              `Retrieved ${data.length} health records with ${totalSteps} total steps`
            );
          } else {
            console.log('No health data available for challenge timeframe');
          }
        });
      });
    }
  }, [challenge?.id, isParticipant, setupHealth]);

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

      // Save the fetched health data so UI can be updated
      setHealthData(latestHealthData);

      const totalSteps = latestHealthData.reduce(
        (sum, day) => sum + day.count,
        0
      );

      // The single health record will now include the entire time range
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

        // Show a more informative success message with progress percentage
        showSuccessToast(
          `Data submitted: ${totalSteps.toLocaleString()} steps (${Math.floor(
            (totalSteps / challenge.goal.value) * 100
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

      // Check if challenge has started
      if (!challengeHasStarted) {
        Alert.alert(
          'Challenge Not Started',
          'This challenge has not started yet. Please wait until the challenge starts to join.'
        );
        return;
      }

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

        // Reset the initialization flag to make sure health data is fetched
        initialDataFetchCompleted.current = false;
        // Trigger health data fetch
        const data = await fetchHealthData();
        if (data && data.length > 0) {
          setHealthData(data);
        }
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
    console.log('fetching challenge details');
    fetchChallengeDetails();
  }, [fetchChallengeDetails]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChallengeDetails();

    if (isParticipant) {
      // Force a fresh health data fetch regardless of initialDataFetchCompleted flag
      isFetchingHealthData.current = false;
      const freshData = await fetchHealthData();
      if (freshData && freshData.length > 0) {
        setHealthData(freshData);
      }
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

  // Calculate total steps from health data
  const totalSteps = healthData.reduce((sum, day) => sum + day.count, 0);

  // Calculate progress percentage from participant data or fallback to calculation from health data
  const progressPercentage =
    userParticipant && userParticipant.progress
      ? Math.floor(userParticipant.progress * 100)
      : Math.floor(personalProgress * 100);

  // If we have a progress percentage but no health data, calculate steps from progress
  const displaySteps =
    totalSteps > 0
      ? totalSteps
      : progressPercentage > 0 && challenge?.goal?.value
      ? Math.floor((progressPercentage / 100) * challenge.goal.value)
      : 0;

  // Check if user is eligible for reward
  const isEligibleForReward =
    challenge?.isCompleted &&
    userParticipant?.completed &&
    !userParticipant?.claimed;

  // Check if user failed the challenge
  const userFailedChallenge =
    challenge?.isCompleted && userParticipant && !userParticipant.completed;

  const isEnded = new Date() > new Date(challenge.endTime * 1000);

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
              disabled={!challengeHasStarted}
              hasStarted={challengeHasStarted}
            />
          )}

          {/* User Progress Card - Show only if user is a participant */}
          {isParticipant && (
            <ProgressCard
              progressPercentage={progressPercentage}
              totalSteps={displaySteps}
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

          {/* Step History Card - Always show for participants, regardless of completion status */}
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
