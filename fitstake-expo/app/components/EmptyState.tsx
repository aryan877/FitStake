import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmptyStateProps } from '../../types';
import theme from '../theme';

const { colors, spacing, fontSize, borderRadius } = theme;

const EmptyState = ({ icon, title, subtitle }: EmptyStateProps) => {
  return (
    <View style={styles.emptyContainer}>
      {icon}
      <Text style={styles.emptyText}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtext}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    margin: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.gray[400],
    fontSize: fontSize.md,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    color: colors.gray[500],
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

export default EmptyState;
