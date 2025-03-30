import { ArrowDown, ArrowUp, Award, ChevronDown } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import useLeaderboard from '../../hooks/useLeaderboard';
import Pagination from '../components/Pagination';
import theme from '../theme';

const { colors } = theme;

// Helper functions
const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

const trimAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(
    address.length - 4
  )}`;
};

// Sort options
type SortOption = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

const sortOptions: SortOption[] = [
  {
    label: 'Steps',
    value: 'stats.totalStepCount',
    icon: <Award size={16} color={colors.accent.primary} />,
  },
  {
    label: 'Challenges Completed',
    value: 'stats.challengesCompleted',
    icon: <Award size={16} color={colors.accent.primary} />,
  },
  {
    label: 'Win Rate',
    value: 'stats.winRate',
    icon: <Award size={16} color={colors.accent.secondary} />,
  },
  {
    label: 'Total Staked',
    value: 'stats.totalStaked',
    icon: <Award size={16} color={colors.accent.primary} />,
  },
  {
    label: 'Total Earned',
    value: 'stats.totalEarned',
    icon: <Award size={16} color={colors.accent.primary} />,
  },
];

// Leaderboard entry type
type LeaderboardEntry = {
  username: string;
  walletAddress: string;
  stats: {
    totalStepCount: number;
    challengesCompleted: number;
    challengesJoined: number;
    challengesCreated: number;
    totalStaked: number;
    totalEarned: number;
    winRate: number;
  };
  badgeCount: number;
};

// Pagination info type
type PaginationInfo = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

// Render item for FlatList
const LeaderboardItem = ({
  item,
  index,
  currentSort,
}: {
  item: LeaderboardEntry;
  index: number;
  currentSort: string;
}) => {
  const rank = index + 1;

  // Determine badge color based on rank
  const getBadgeColor = (rank: number) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return colors.gray[700];
  };

  // Get value to display based on current sort
  const getSortValue = (item: LeaderboardEntry, sort: string) => {
    switch (sort) {
      case 'stats.totalStepCount':
        return formatNumber(item.stats.totalStepCount);
      case 'stats.challengesCompleted':
        return formatNumber(item.stats.challengesCompleted);
      case 'stats.winRate':
        return `${item.stats.winRate.toFixed(0)}%`;
      case 'stats.totalStaked':
        return `${(item.stats.totalStaked / 1000000000).toFixed(2)} SOL`;
      case 'stats.totalEarned':
        return `${(item.stats.totalEarned / 1000000000).toFixed(2)} SOL`;
      default:
        return formatNumber(item.stats.totalStepCount);
    }
  };

  return (
    <View style={styles.leaderboardItem}>
      {/* Rank */}
      <View
        style={[styles.rankBadge, { backgroundColor: getBadgeColor(rank) }]}
      >
        <Text style={styles.rankText}>{rank}</Text>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.walletAddress}>
          {trimAddress(item.walletAddress)}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statValue}>{getSortValue(item, currentSort)}</Text>
        <Text style={styles.badgeCount}>{item.badgeCount} badges</Text>
      </View>
    </View>
  );
};

export default function LeaderboardScreen() {
  const {
    leaderboard,
    pagination,
    loading,
    error,
    params,
    fetchLeaderboard,
    updateSort,
    changePage,
  } = useLeaderboard();

  const [selectedSortOption, setSelectedSortOption] = useState(sortOptions[0]);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Initial data fetch
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Toggle sort order
  const toggleSortOrder = () => {
    const newOrder = params.sortOrder === 'asc' ? 'desc' : 'asc';
    updateSort(params.sortBy || 'stats.totalStepCount', newOrder);
  };

  // Handle sort option selection
  const handleSortSelect = (option: SortOption) => {
    setSelectedSortOption(option);
    setShowSortMenu(false);
    updateSort(option.value, params.sortOrder);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    changePage(page);
  };

  // Render sort dropdown button
  const renderSortButton = () => (
    <TouchableOpacity
      style={styles.sortButton}
      onPress={() => setShowSortMenu(!showSortMenu)}
    >
      <View style={styles.sortButtonContent}>
        {selectedSortOption.icon}
        <Text style={styles.sortButtonText}>{selectedSortOption.label}</Text>
        <ChevronDown size={16} color={colors.gray[400]} />
      </View>

      <TouchableOpacity style={styles.orderButton} onPress={toggleSortOrder}>
        {params.sortOrder === 'desc' ? (
          <ArrowDown size={16} color={colors.gray[300]} />
        ) : (
          <ArrowUp size={16} color={colors.gray[300]} />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render sort dropdown menu
  const renderSortMenu = () => (
    <View style={styles.sortMenu}>
      {sortOptions.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.sortMenuItem,
            params.sortBy === option.value && styles.selectedSortMenuItem,
          ]}
          onPress={() => handleSortSelect(option)}
        >
          <View style={styles.sortMenuItemContent}>
            {option.icon}
            <Text
              style={[
                styles.sortMenuItemText,
                params.sortBy === option.value &&
                  styles.selectedSortMenuItemText,
              ]}
            >
              {option.label}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Close sort menu when clicked outside
  const handlePressOutside = () => {
    if (showSortMenu) setShowSortMenu(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>All-time achievements</Text>
      </View>

      {/* Controls section with higher z-index */}
      <View style={styles.controlsWrapper}>
        <View style={styles.controls}>
          <View style={styles.sortContainer}>
            {renderSortButton()}
            {showSortMenu && renderSortMenu()}
          </View>
        </View>
      </View>

      {/* Content with lower z-index */}
      <Pressable style={styles.contentContainer} onPress={handlePressOutside}>
        {loading && leaderboard.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchLeaderboard()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={leaderboard}
            keyExtractor={(item) => item.walletAddress}
            renderItem={({ item, index }) => (
              <LeaderboardItem
                item={item}
                index={index + (pagination.page - 1) * pagination.limit}
                currentSort={params.sortBy || 'stats.totalStepCount'}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No data available</Text>
              </View>
            }
          />
        )}

        {/* Pagination */}
        {!loading && !error && pagination.pages > 1 && (
          <View style={styles.paginationContainer}>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
            />
          </View>
        )}
      </Pressable>
    </SafeAreaView>
  );
}

// Define styles first to avoid usage before declaration
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[400],
  },
  controlsWrapper: {
    zIndex: 100,
    position: 'relative',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
  },
  sortContainer: {
    position: 'relative',
    zIndex: 10,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[900],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sortButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  sortButtonText: {
    color: colors.gray[300],
    fontSize: 14,
    marginLeft: 4,
    marginRight: 4,
  },
  orderButton: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 4,
    backgroundColor: colors.gray[800],
  },
  sortMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.gray[900],
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 20,
  },
  sortMenuItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[800],
  },
  selectedSortMenuItem: {
    backgroundColor: colors.gray[800],
  },
  sortMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortMenuItemText: {
    color: colors.gray[300],
    fontSize: 14,
    marginLeft: 8,
  },
  selectedSortMenuItemText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 6,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[900],
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.gray[700],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  userInfo: {
    flex: 1,
  },
  userTextContainer: {
    marginLeft: 10,
  },
  username: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  walletAddress: {
    color: colors.gray[400],
    fontSize: 12,
    marginTop: 2,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  statValue: {
    color: colors.accent.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  badgeCount: {
    color: colors.gray[400],
    fontSize: 12,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: colors.accent.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.gray[400],
    textAlign: 'center',
  },
  paginationContainer: {
    paddingVertical: 16,
  },
});
