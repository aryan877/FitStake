import { X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChallengeFilters } from '../../types/challenge';
import theme from '../theme';
import FilterChip from './FilterChip';

const { colors, spacing, fontSize, borderRadius } = theme;

interface ActiveFiltersProps {
  filters: ChallengeFilters;
  onClearFilters: () => void;
}

const ActiveFilters = ({ filters, onClearFilters }: ActiveFiltersProps) => {
  const hasActiveFilters =
    filters.minStake !== undefined ||
    filters.maxStake !== undefined ||
    filters.minGoal !== undefined ||
    filters.maxGoal !== undefined ||
    filters.minParticipants !== undefined ||
    filters.maxParticipants !== undefined ||
    filters.sortBy !== 'createdAt' ||
    filters.sortOrder !== 'desc' ||
    filters.status !== 'active';

  if (!hasActiveFilters) {
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
        {filters.status !== 'active' && (
          <FilterChip label={`Status: ${filters.status}`} />
        )}
        {filters.minStake !== undefined && (
          <FilterChip label={`Min Stake: ${filters.minStake}`} />
        )}
        {filters.maxStake !== undefined && (
          <FilterChip label={`Max Stake: ${filters.maxStake}`} />
        )}
        {filters.minGoal !== undefined && (
          <FilterChip label={`Min Goal: ${filters.minGoal}`} />
        )}
        {filters.maxGoal !== undefined && (
          <FilterChip label={`Max Goal: ${filters.maxGoal}`} />
        )}
        {filters.minParticipants !== undefined && (
          <FilterChip label={`Min Participants: ${filters.minParticipants}`} />
        )}
        {filters.maxParticipants !== undefined && (
          <FilterChip label={`Max Participants: ${filters.maxParticipants}`} />
        )}
        {(filters.sortBy !== 'createdAt' || filters.sortOrder !== 'desc') && (
          <FilterChip
            label={`Sort: ${filters.sortBy} (${filters.sortOrder})`}
          />
        )}
      </View>
    </View>
  );
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
