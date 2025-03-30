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
      setCurrentTimeRemaining(
        formatTimeDisplay(challenge.startTime, challenge.endTime)
      );

      // Update hasStarted status
      setChallengeHasStarted(hasStarted(challenge.startTime));
    }
  }, [challenge]);

  // Setup timer for live countdown
  useEffect(() => {
    console.log('setting up timer');
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
      const challengeStartTime = new Date(challenge.startTime * 1000);
      const challengeEndTime = new Date(challenge.endTime * 1000);
      const now = new Date();

      // If challenge hasn't ended yet, use current date as end boundary
      const actualEndDate = now < challengeEndTime ? now : challengeEndTime;

      // Calculate number of days in challenge (up to current date)
      const startDay = new Date(challengeStartTime);
      startDay.setHours(0, 0, 0, 0); // Start of the first day

      const endDay = new Date(actualEndDate);
      endDay.setHours(23, 59, 59, 999); // End of the last day

      // Calculate the difference in days between start and end
      const dayDiff =
        Math.floor(
          (endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;

      // Fetch data for each day individually
      const allStepsData: StepsData[] = [];

      for (let i = 0; i < dayDiff; i++) {
        const currentDate = new Date(startDay);
        currentDate.setDate(startDay.getDate() + i);

        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        // Don't exceed the actual challenge end time or current time
        const adjustedDayEnd = new Date(
          Math.min(dayEnd.getTime(), actualEndDate.getTime())
        );

        // Don't request data before the challenge start time
        const adjustedDayStart = new Date(
          Math.max(dayStart.getTime(), challengeStartTime.getTime())
        );

        // Only fetch if the day start is before the end time
        if (adjustedDayStart <= adjustedDayEnd) {
          const dayData = await fetchStepsForDateRange(
            adjustedDayStart,
            adjustedDayEnd
          );

          if (dayData && Array.isArray(dayData) && dayData.length > 0) {
            // Update with consistent dateISO for easier matching
            const updatedDayData = {
              ...dayData[0],
              dateISO: dayStart.toISOString().split('T')[0],
              date: dayStart.toLocaleDateString('en-US'),
            };
            allStepsData.push(updatedDayData);
          } else {
            // Add empty record for days with no data
            allStepsData.push({
              date: dayStart.toLocaleDateString('en-US'),
              dateISO: dayStart.toISOString().split('T')[0],
              count: 0,
              startTime: adjustedDayStart.toISOString(),
              endTime: adjustedDayEnd.toISOString(),
              sources: [],
              recordCount: 0,
              timestamps: [],
              records: [],
            });
          }
        }
      }

      // Only set health data if we got valid data back and component is still mounted
      if (allStepsData.length > 0) {
        setHealthData(allStepsData);

        // Calculate total steps and progress
        const totalSteps = allStepsData.reduce(
          (sum, day) => sum + day.count,
          0
        );
        const calculatedProgress = Math.min(
          1,
          totalSteps / challenge.goal.value
        );
        setPersonalProgress(calculatedProgress);
      }

      return allStepsData;
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
    console.log('fetching challenge details');
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
              disabled={!challengeHasStarted}
              hasStarted={challengeHasStarted}
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
