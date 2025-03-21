import { usePrivy } from '@privy-io/expo';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Plus, Sliders, Trophy } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ChallengeFilters, useChallenges } from '../../hooks/useChallenges';
import { useSolanaWallet } from '../../hooks/useSolanaWallet';
import ActiveFilters from '../components/ActiveFilters';
import ChallengeCard from '../components/ChallengeCard';
import CreateChallengeModal from '../components/CreateChallengeModal';
import EmptyState from '../components/EmptyState';
import FilterButton from '../components/FilterButton';
import FilterModal from '../components/FilterModal';
import theme from '../theme';
import { showErrorToast, showSuccessToast } from '../utils/errorHandling';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

export default function ChallengesScreen() {
  const { user } = usePrivy();
  const { address: walletAddress, balance } = useSolanaWallet();
  const {
    challenges,
    loading,
    error,
    fetchChallenges,
    joinChallenge,
    createChallenge,
    filterParams,
    updateFilters,
  } = useChallenges();
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    stakeAmount: '0.1',
    goalSteps: '10000',
    durationDays: '1',
    minParticipants: '2',
    maxParticipants: '10',
  });
  const [filters, setFilters] = useState<ChallengeFilters>({
    status: 'active',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [joiningChallengeId, setJoiningChallengeId] = useState<string | null>(
    null
  );
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const handleJoinChallenge = async (challengeId: string) => {
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

      setJoiningChallengeId(challengeId);

      // Find the challenge to get its stake amount
      const challenge = challenges.find((c) => c.id === challengeId);
      if (!challenge) {
        showErrorToast(
          new Error('Challenge not found'),
          'Failed to join the challenge'
        );
        setJoiningChallengeId(null);
        return;
      }

      // Check if user is already a participant
      const isAlreadyParticipant = challenge.participants.some(
        (p) => p.walletAddress === walletAddress
      );

      if (isAlreadyParticipant) {
        showErrorToast(
          new Error('Already joined'),
          'You are already a participant in this challenge'
        );
        setJoiningChallengeId(null);
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
        setJoiningChallengeId(null);
        return;
      }

      const success = await joinChallenge(challengeId);
      if (success) {
        showSuccessToast('You have successfully joined the challenge!');
      }
    } catch (err) {
      console.error('Error joining challenge:', err);
      showErrorToast(err, 'Failed to join the challenge');
    } finally {
      setJoiningChallengeId(null);
    }
  };

  const handleCreateChallenge = async () => {
    if (!user || !walletAddress) {
      Alert.alert(
        'Authentication Required',
        'Please log in to create a challenge.'
      );
      return;
    }

    // Validate inputs
    if (!newChallenge.title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your challenge.');
      return;
    }

    if (!newChallenge.description.trim()) {
      Alert.alert(
        'Missing Description',
        'Please provide a description for your challenge.'
      );
      return;
    }

    const stakeAmount = parseFloat(newChallenge.stakeAmount);
    if (isNaN(stakeAmount) || stakeAmount <= 0) {
      Alert.alert(
        'Invalid Stake Amount',
        'Please enter a valid stake amount greater than 0.'
      );
      return;
    }

    const goalSteps = parseInt(newChallenge.goalSteps);
    if (isNaN(goalSteps) || goalSteps <= 0) {
      Alert.alert(
        'Invalid Goal',
        'Please enter a valid step goal greater than 0.'
      );
      return;
    }

    const durationDays = parseInt(newChallenge.durationDays);
    if (isNaN(durationDays) || durationDays <= 0) {
      Alert.alert(
        'Invalid Duration',
        'Please enter a valid duration in days greater than 0.'
      );
      return;
    }

    const minParticipants = parseInt(newChallenge.minParticipants);
    if (isNaN(minParticipants) || minParticipants < 2) {
      Alert.alert(
        'Invalid Min Participants',
        'Please enter at least 2 minimum participants.'
      );
      return;
    }

    const maxParticipants = parseInt(newChallenge.maxParticipants);
    if (isNaN(maxParticipants) || maxParticipants < minParticipants) {
      Alert.alert(
        'Invalid Max Participants',
        'Max participants must be at least equal to min participants.'
      );
      return;
    }

    // Check if user has sufficient balance to create challenge
    if (balance !== null && balance < stakeAmount) {
      Alert.alert(
        'Insufficient Balance',
        `You need at least ${stakeAmount} SOL to create this challenge. Your balance: ${balance.toFixed(
          4
        )} SOL.`
      );
      return;
    }

    setIsCreating(true);

    try {
      const now = Math.floor(Date.now() / 1000);
      const endTime = now + durationDays * 24 * 60 * 60; // Convert days to seconds

      const challengeParams = {
        title: newChallenge.title,
        description: newChallenge.description,
        stakeAmount: Math.floor(stakeAmount * LAMPORTS_PER_SOL), // Convert SOL to lamports
        startTime: now,
        endTime: endTime,
        minParticipants: minParticipants,
        maxParticipants: maxParticipants,
        goalSteps: goalSteps,
      };

      const result = await createChallenge(challengeParams);

      if (result) {
        showSuccessToast('Challenge created successfully!');
        setCreateModalVisible(false);
        // Reset form
        setNewChallenge({
          title: '',
          description: '',
          stakeAmount: '0.1',
          goalSteps: '10000',
          durationDays: '1',
          minParticipants: '2',
          maxParticipants: '10',
        });
        // Refresh challenges list
        fetchChallenges();
      } else {
        Alert.alert('Failed to create challenge', 'Please try again later.');
      }
    } catch (err) {
      console.error('Error creating challenge:', err);
      showErrorToast(err, 'Failed to create challenge');
    } finally {
      setIsCreating(false);
    }
  };

  const handleApplyFilters = async () => {
    try {
      await updateFilters(filters);
      setFilterModalVisible(false);
    } catch (err) {
      console.error('Error applying filters:', err);
      showErrorToast(err, 'Failed to apply filters');
    }
  };

  const handleChallengeFormChange = (field: string, value: string) => {
    setNewChallenge((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = async () => {
    const defaultFilters: ChallengeFilters = {
      status: 'active',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      minStake: undefined,
      maxStake: undefined,
      minGoal: undefined,
      maxGoal: undefined,
      minParticipants: undefined,
      maxParticipants: undefined,
    };

    setFilters(defaultFilters);
    await updateFilters(defaultFilters);
    setFilterModalVisible(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchChallenges();
    } catch (err) {
      console.error('Error refreshing challenges:', err);
      showErrorToast(err, 'Failed to refresh challenges');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchChallenges();
      } catch (err) {
        console.error('Error loading initial data:', err);
      } finally {
        setIsInitialLoad(false);
      }
    };

    loadInitialData();
  }, [fetchChallenges]);

  if ((loading && !refreshing && !isCreating) || isInitialLoad) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <Text style={styles.loadingText}>Loading challenges...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.accent.primary]}
            tintColor={colors.accent.primary}
            progressBackgroundColor={colors.gray[800]}
            progressViewOffset={10}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Challenges</Text>
          <Text style={styles.subtitle}>
            Join fitness challenges and earn rewards
          </Text>
        </View>

        <View style={styles.actionButtonsContainer}>
          <FilterButton
            icon={<Sliders size={16} color={colors.white} />}
            text="Filter"
            onPress={() => setFilterModalVisible(true)}
          />

          <FilterButton
            icon={<Plus size={16} color={colors.white} />}
            text="Create Challenge"
            primary
            onPress={() => setCreateModalVisible(true)}
          />
        </View>

        <ActiveFilters filters={filters} onClearFilters={clearFilters} />

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={fetchChallenges}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : challenges.length === 0 ? (
          <EmptyState
            icon={<Trophy color={colors.gray[400]} size={48} />}
            title="No challenges found"
            subtitle="Try adjusting your filters or create a new challenge"
          />
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {filters.status === 'active'
                ? 'Active Challenges'
                : filters.status === 'completed'
                ? 'Completed Challenges'
                : 'All Challenges'}
            </Text>
            <View style={styles.challengesList}>
              {challenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onJoin={handleJoinChallenge}
                  isJoining={joiningChallengeId === challenge.id}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Challenge Creation Modal */}
      <CreateChallengeModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={handleCreateChallenge}
        isCreating={isCreating}
        challenge={newChallenge}
        onChange={handleChallengeFormChange}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        onClearFilters={clearFilters}
        filters={filters}
        setFilters={setFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
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
  loadingText: {
    color: colors.gray[300],
    marginTop: spacing.md,
    fontSize: fontSize.md,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  errorContainer: {
    margin: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.gray[900],
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    color: colors.accent.error,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.gray[700],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  challengesList: {
    gap: spacing.md,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  challengeCard: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  challengeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  challengeCardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
    flex: 1,
  },
  challengeCardDesc: {
    fontSize: fontSize.sm,
    color: colors.gray[300],
    marginBottom: spacing.md,
  },
  challengeCardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
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
  challengeCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeCardEndDate: {
    fontSize: fontSize.sm,
    color: colors.accent.primary,
    fontWeight: fontWeight.medium,
  },
  joinButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  joinButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  needsParticipantsBadge: {
    backgroundColor: colors.accent.secondary,
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  needsParticipantsText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: fontWeight.medium,
  },
  joinPromptText: {
    color: colors.accent.secondary,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
});
