import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import theme from '../theme';
import { FilterChipProps } from '../../types';

const { colors, spacing, borderRadius, fontSize } = theme;



const FilterChip = ({ label }: FilterChipProps) => {
  return (
    <View style={styles.filterChip}>
      <Text style={styles.filterChipText}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  filterChip: {
    backgroundColor: colors.gray[800],
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  filterChipText: {
    fontSize: fontSize.xs,
    color: colors.gray[300],
  },
});

export default FilterChip;
