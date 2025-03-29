import { usePrivy } from '@privy-io/expo';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Plus, Search, Sliders, Trophy, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAdmin } from '../../hooks/useAdmin';
import { useChallenges } from '../../hooks/useChallenges';
import { useDebounce } from '../../hooks/useDebounce';
import { useSolanaWallet } from '../../hooks/useSolanaWallet';
import { ChallengeFilters, ChallengeVisibility } from '../../types/challenge';
import ChallengeCard from '../components/challenge/ChallengeCard';
import EmptyState from '../components/EmptyState';
import ActiveFilters from '../components/home/ActiveFilters';
import CreateChallengeModal from '../components/home/CreateChallengeModal';
import FilterButton from '../components/home/FilterButton';
import FilterModal from '../components/home/FilterModal';
import theme from '../theme';
import { showErrorToast, showSuccessToast } from '../utils/errorHandling';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

const DEBOUNCE_TIMEOUT = 500;

export default function ChallengesScreen() {
  const { user } = usePrivy();
  const { isAdmin } = useAdmin();
  const { address: walletAddress, balance } = useSolanaWallet();
  const {
    challenges,
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
  const [activeTab, setActiveTab] = useState('public'); // public, private
  const [searchText, setSearchText] = useState('');
  const [searchInputText, setSearchInputText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isTabContentLoading, setIsTabContentLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 0);

  const now = new Date();
  now.setMinutes(now.getMinutes() + 10); // Set start time 10 minutes from now

  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    stakeAmount: '0.1',
    goalSteps: '10000',
    startDate: null as Date | null,
    endDate: null as Date | null,
    minParticipants: '2',
    maxParticipants: '10',
    isPublic: false,
  });

  // Initialize filters with proper defaults including visibility
  const [filters, setFilters] = useState<ChallengeFilters>({
    status: 'active',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    visibility: 'public' as ChallengeVisibility,
    minStake: undefined,
    maxStake: undefined,
    minGoal: undefined,
    maxGoal: undefined,
    minParticipants: undefined,
    maxParticipants: undefined,
    searchText: undefined,
  });

  const [isCreating, setIsCreating] = useState(false);
  const [joiningChallengeId, setJoiningChallengeId] = useState<string | null>(
    null
  );
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Define debounced search handler callback
  const handleSearchUpdate = useCallback(
    (text: string) => {
      setSearchText(text);
      // Preserve existing filters while updating the search text
      const updatedFilters = {
        ...filters,
        searchText: text.trim() === '' ? undefined : text.trim(),
      };
      setFilters(updatedFilters);
      setIsSearching(true);
      updateFilters(updatedFilters).finally(() => {
        setIsSearching(false);
      });
    },
    [filters, updateFilters]
  );

  // Setup debounced functions
  const [debouncedSearchHandler, cancelSearchDebounce] = useDebounce(
    handleSearchUpdate,
    DEBOUNCE_TIMEOUT
  );

  // Handle tab change
  const handleTabChange = (tab: string) => {
    // Only update the tab state if different
    if (tab === activeTab) return;

    // Update active tab immediately
    setActiveTab(tab);

    // Update filters based on tab
    let updatedFilters = { ...filters };
    setIsTabContentLoading(true);

    if (tab === 'public') {
      updatedFilters = {
        ...updatedFilters,
        visibility: 'public' as ChallengeVisibility,
        // Preserve search text when switching tabs
        searchText: searchText.trim() === '' ? undefined : searchText.trim(),
      };
    } else if (tab === 'private') {
      // For private challenges tab, show private challenges
      updatedFilters = {
        ...updatedFilters,
        visibility: 'private' as ChallengeVisibility,
        // Preserve search text when switching tabs
        searchText: searchText.trim() === '' ? undefined : searchText.trim(),
      };
    }

    // Update filters in state first
    setFilters(updatedFilters);

    // Then fetch challenges with the updated filters
    try {
      updateFilters(updatedFilters)
        .then(() => {
          setIsSearching(false);
          setIsTabContentLoading(false);
        })
        .catch((err) => {
          console.error('Error updating filters:', err);
          setIsTabContentLoading(false);
          setIsSearching(false);
        });
    } catch (err) {
      console.error('Error in handleTabChange:', err);
      setIsTabContentLoading(false);
      setIsSearching(false);
    }
  };

  // Handle searching by text with debouncing
  const handleSearchTextChange = (text: string) => {
    setSearchInputText(text);
    debouncedSearchHandler(text);
  };

  // Clear search text
  const clearSearchText = () => {
    setSearchInputText('');
    setSearchText('');
    cancelSearchDebounce();
    const updatedFilters = {
      ...filters,
      searchText: undefined,
    };
    setFilters(updatedFilters);
    updateFilters(updatedFilters);
  };

  // Convert isPublic from string to boolean
  const isPublicValue = (value: string | boolean): boolean => {
    if (typeof value === 'boolean') {
      return value;
    }
    return value === 'true';
  };

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
        return;
      }

      // Check if user is already a participant
      const isParticipant = challenge.participants.some(
        (p) => p.walletAddress === walletAddress
      );

      if (isParticipant) {
        showSuccessToast('You have already joined this challenge');
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
        return;
      }

      const success = await joinChallenge(challengeId);
      if (success) {
        showSuccessToast('You have successfully joined the challenge!');
        // Refresh the challenges list
        await fetchChallenges(filterParams);
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

    // Validate dates
    if (!newChallenge.startDate) {
      Alert.alert('Missing Start Date', 'Please select a start date and time.');
      return;
    }

    if (!newChallenge.endDate) {
      Alert.alert('Missing End Date', 'Please select an end date and time.');
      return;
    }

    const currentTime = new Date();
    if (newChallenge.startDate < currentTime) {
      Alert.alert('Invalid Start Date', 'Start date cannot be in the past.');
      return;
    }

    if (newChallenge.endDate <= newChallenge.startDate) {
      Alert.alert('Invalid End Date', 'End date must be after the start date.');
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

    // Check if user has sufficient balance
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
      // Convert isPublic from string to boolean
      const isPublic = isPublicValue(newChallenge.isPublic as any);

      const challengeParams = {
        title: newChallenge.title,
        description: newChallenge.description,
        stakeAmount: Math.floor(stakeAmount * LAMPORTS_PER_SOL), // Convert SOL to lamports
        startTime: Math.floor(newChallenge.startDate.getTime() / 1000),
        endTime: Math.floor(newChallenge.endDate.getTime() / 1000),
        minParticipants: minParticipants,
        maxParticipants: maxParticipants,
        goalSteps: goalSteps,
        isPublic: isPublic,
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
          startDate: null,
          endDate: null,
          minParticipants: '2',
          maxParticipants: '10',
          isPublic: false,
        });

        // If created a private challenge, update the filter to show it
        if (!isPublic) {
          const privateFilter = {
            ...filters,
            visibility: 'private' as ChallengeVisibility,
          };
          setActiveTab('private');
          setFilters(privateFilter);
          await updateFilters(privateFilter);
        } else {
          // Refresh challenges list with current filters
          await fetchChallenges(filterParams);
        }
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
      setIsSearching(true);
      console.log('Applying filters:', filters);

      // Make sure the filters match the active tab
      const updatedFilters = {
        ...filters,
        visibility:
          activeTab === 'public'
            ? ('public' as ChallengeVisibility)
            : ('private' as ChallengeVisibility),
      };

      // Update local state
      setFilters(updatedFilters);

      // Apply the filters and fetch challenges
      await updateFilters(updatedFilters);
      setFilterModalVisible(false);
    } catch (err) {
      console.error('Error applying filters:', err);
      showErrorToast(err, 'Failed to apply filters');
    } finally {
      setIsSearching(false);
    }
  };

  const handleChallengeFormChange = (field: string, value: string | Date) => {
    setNewChallenge((prev) => {
      // Special handling for isPublic field
      if (field === 'isPublic') {
        return {
          ...prev,
          [field]: value === 'true',
        };
      }

      // Default handling for other fields
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const clearFilters = async () => {
    try {
      setIsSearching(true);
      // Cancel any pending debounced searches
      cancelSearchDebounce();

      // Create a clean default filters object with only the necessary fields
      const defaultFilters: ChallengeFilters = {
        status: 'active',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        visibility:
          activeTab === 'public'
            ? ('public' as ChallengeVisibility)
            : ('private' as ChallengeVisibility),
        // Reset all the numeric filters explicitly to undefined
        minStake: undefined,
        maxStake: undefined,
        minGoal: undefined,
        maxGoal: undefined,
        minParticipants: undefined,
        maxParticipants: undefined,
        // Clear search text
        searchText: undefined,
      };

      // Reset UI state
      setSearchText('');
      setSearchInputText('');

      // Update the filters state
      setFilters(defaultFilters);

      // Apply the filter changes and fetch updated results
      await updateFilters(defaultFilters);

      // Close the filter modal if it's open
      setFilterModalVisible(false);
    } catch (err) {
      console.error('Error clearing filters:', err);
      showErrorToast(err, 'Failed to clear filters');
    } finally {
      setIsSearching(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchChallenges(filters);
    } catch (err) {
      console.error('Error refreshing challenges:', err);
      showErrorToast(err, 'Failed to refresh challenges');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Skip if already initialized
    if (initialized) return;

    const loadInitialData = async () => {
      try {
        setIsInitialLoad(true);
        // Set initial filters with hardcoded visibility for first load only
        const initialFilters = {
          ...filterParams,
          visibility: 'public' as ChallengeVisibility,
          // Initialize with explicit undefined values for all numeric filters
          minStake: undefined,
          maxStake: undefined,
          minGoal: undefined,
          maxGoal: undefined,
          minParticipants: undefined,
          maxParticipants: undefined,
        };

        // Update local state
        setFilters(initialFilters);

        // Fetch initial data
        await fetchChallenges(initialFilters);

        // Mark as initialized only after successful fetch
        setInitialized(true);
      } catch (err) {
        console.error('Error loading initial data:', err);
        showErrorToast(err, 'Failed to load challenges');
      } finally {
        setIsInitialLoad(false);
      }
    };

    loadInitialData();
  }, []); // Empty dependency array - runs once on mount

  // Define tabContent as a variable to avoid repetitive conditional rendering in the JSX
  const renderTabContent = () => {
    // For error state
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => fetchChallenges(filters)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    // For empty state
    if (challenges.length === 0 && !isTabContentLoading) {
      return (
        <EmptyState
          icon={<Trophy color={colors.gray[400]} size={48} />}
          title={
            activeTab === 'public'
              ? 'No public challenges found'
              : 'No private challenges found'
          }
          subtitle={
            activeTab === 'public'
              ? 'Try adjusting your filters or create a new challenge'
              : 'Create your own private challenge or search by challenge ID'
          }
        />
      );
    }

    // Display the challenge list with optional loading indicator
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'public'
              ? 'Public Challenges'
              : 'Private Challenges'}
          </Text>

          {isTabContentLoading && (
            <ActivityIndicator
              size="small"
              color={colors.accent.primary}
              style={styles.inlineLoader}
            />
          )}
        </View>

        <View
          style={[
            styles.challengesList,
            isTabContentLoading && styles.fadedContent,
          ]}
        >
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
    );
  };

  if (isInitialLoad) {
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

        {/* Tab navigation between public and private */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'public' && styles.activeTabButton,
            ]}
            onPress={() => handleTabChange('public')}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'public' && styles.activeTabButtonText,
              ]}
            >
              Public Challenges
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'private' && styles.activeTabButton,
            ]}
            onPress={() => handleTabChange('private')}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'private' && styles.activeTabButtonText,
              ]}
            >
              Private Challenges
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search section - unified for all tabs */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search
              size={16}
              color={colors.gray[400]}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={
                activeTab === 'public'
                  ? 'Search challenges or challenge ID...'
                  : 'Search your challenges or challenge ID...'
              }
              placeholderTextColor={colors.gray[500]}
              value={searchInputText}
              onChangeText={handleSearchTextChange}
            />
            {searchInputText ? (
              <Pressable style={styles.clearButton} onPress={clearSearchText}>
                <X size={16} color={colors.gray[400]} />
              </Pressable>
            ) : null}
          </View>
          {isSearching && (
            <ActivityIndicator
              size="small"
              color={colors.accent.primary}
              style={styles.searchingIndicator}
            />
          )}
        </View>

        <View style={styles.actionButtonsContainer}>
          <FilterButton
            icon={<Sliders size={16} color={colors.white} />}
            text="Filter"
            onPress={() => setFilterModalVisible(true)}
          />

          {activeTab === 'public' ? (
            isAdmin ? (
              <FilterButton
                icon={<Plus size={16} color={colors.white} />}
                text="Create Public"
                primary
                onPress={() => {
                  setNewChallenge((prev) => ({
                    ...prev,
                    isPublic: true,
                  }));
                  setCreateModalVisible(true);
                }}
              />
            ) : null
          ) : (
            <FilterButton
              icon={<Plus size={16} color={colors.white} />}
              text="Create Private"
              primary
              onPress={() => {
                setNewChallenge((prev) => ({
                  ...prev,
                  isPublic: false,
                }));
                setCreateModalVisible(true);
              }}
            />
          )}
        </View>

        <ActiveFilters filters={filters} onClearFilters={clearFilters} />

        {renderTabContent()}
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.gray[800],
  },
  activeTabButton: {
    borderBottomColor: colors.accent.primary,
  },
  tabButtonText: {
    color: colors.gray[400],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  activeTabButtonText: {
    color: colors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    color: colors.white,
    fontSize: fontSize.sm,
  },
  clearButton: {
    padding: spacing.xs,
  },
  searchingIndicator: {
    marginLeft: spacing.sm,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContentLoading: {
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  inlineLoader: {
    marginLeft: spacing.sm,
  },
  fadedContent: {
    opacity: 0.7,
  },
});
