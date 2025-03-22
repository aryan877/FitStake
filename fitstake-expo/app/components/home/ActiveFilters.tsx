import theme from '@/app/theme';
import { ChallengeFilters } from '@/types';
import { X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FilterChip from './FilterChip';

const { colors, spacing, fontSize, borderRadius } = theme;

interface ActiveFiltersProps {
  filters: ChallengeFilters;
  onClearFilters: () => void;
}

const ActiveFilters = ({ filters, onClearFilters }: ActiveFiltersProps) => {
  // Format stake amount in SOL for better display
  const formatStakeAmount = (amount: number): string => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // Helper to determine if filters have been modified from default values
  const hasActiveFilters = (): boolean => {
    // These checks are for custom filters beyond the default settings
    return (
      (filters.minStake !== undefined && filters.minStake > 0) ||
      (filters.maxStake !== undefined && filters.maxStake > 0) ||
      (filters.minGoal !== undefined && filters.minGoal > 0) ||
      (filters.maxGoal !== undefined && filters.maxGoal > 0) ||
      (filters.minParticipants !== undefined && filters.minParticipants > 0) ||
      (filters.maxParticipants !== undefined && filters.maxParticipants > 0) ||
      (filters.sortBy !== undefined && filters.sortBy !== 'createdAt') ||
      (filters.sortOrder !== undefined && filters.sortOrder !== 'desc') ||
      (filters.status !== undefined && filters.status !== 'active') ||
      (filters.searchText !== undefined && filters.searchText !== '')
    );
  };

  if (!hasActiveFilters()) {
    return null;
  }

  return (
    <View style={styles.activeFiltersContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.activeFiltersTitle}>Active Filters</Text>
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={onClearFilters}
        >
          <Text style={styles.clearFiltersText}>Clear All</Text>
          <X size={14} color={colors.accent.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.filterChipsContainer}>
        {filters.status !== 'active' && filters.status !== undefined && (
          <FilterChip
            label={`Status: ${
              filters.status.charAt(0).toUpperCase() + filters.status.slice(1)
            }`}
          />
        )}

        {filters.minStake !== undefined && filters.minStake > 0 && (
          <FilterChip
            label={`Min Stake: ${formatStakeAmount(filters.minStake)} SOL`}
          />
        )}

        {filters.maxStake !== undefined && filters.maxStake > 0 && (
          <FilterChip
            label={`Max Stake: ${formatStakeAmount(filters.maxStake)} SOL`}
          />
        )}

        {filters.minGoal !== undefined && filters.minGoal > 0 && (
          <FilterChip
            label={`Min Goal: ${filters.minGoal.toLocaleString()} steps`}
          />
        )}

        {filters.maxGoal !== undefined && filters.maxGoal > 0 && (
          <FilterChip
            label={`Max Goal: ${filters.maxGoal.toLocaleString()} steps`}
          />
        )}

        {filters.minParticipants !== undefined &&
          filters.minParticipants > 0 && (
            <FilterChip
              label={`Min Participants: ${filters.minParticipants}`}
            />
          )}

        {filters.maxParticipants !== undefined &&
          filters.maxParticipants > 0 && (
            <FilterChip
              label={`Max Participants: ${filters.maxParticipants}`}
            />
          )}

        {(filters.sortBy !== 'createdAt' || filters.sortOrder !== 'desc') &&
          filters.sortBy !== undefined &&
          filters.sortOrder !== undefined && (
            <FilterChip
              label={`Sort: ${getSortByLabel(filters.sortBy)} (${
                filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'
              })`}
            />
          )}

        {filters.searchText !== undefined && filters.searchText !== '' && (
          <FilterChip label={`Search: ${filters.searchText}`} />
        )}
      </View>
    </View>
  );
};

// Helper function to get a readable label for sort options
const getSortByLabel = (sortBy: string): string => {
  switch (sortBy) {
    case 'createdAt':
      return 'Newest';
    case 'endTime':
      return 'End Time';
    case 'stakeAmount':
      return 'Stake Amount';
    default:
      return sortBy;
  }
};

const styles = StyleSheet.create({
  activeFiltersContainer: {
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.md,
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[800],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  activeFiltersTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.white,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[800],
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  clearFiltersText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.accent.primary,
  },
});

export default ActiveFilters;
