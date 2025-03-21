import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import theme from '../theme';

const { colors, spacing, borderRadius, fontSize, fontWeight } = theme;

interface FilterButtonProps {
  onPress: () => void;
  text: string;
  icon: React.ReactNode;
  primary?: boolean;
}

const FilterButton = ({
  onPress,
  text,
  icon,
  primary = false,
}: FilterButtonProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.filterButton,
        primary ? styles.primaryButton : styles.secondaryButton,
      ]}
      onPress={onPress}
    >
      {icon}
      <Text
        style={[
          styles.filterButtonText,
          primary ? styles.primaryButtonText : styles.secondaryButtonText,
        ]}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    flex: 1,
    gap: spacing.xs,
  },
  primaryButton: {
    backgroundColor: colors.accent.primary,
  },
  secondaryButton: {
    backgroundColor: colors.gray[800],
  },
  filterButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  primaryButtonText: {
    color: colors.white,
  },
  secondaryButtonText: {
    color: colors.white,
  },
});

export default FilterButton;
