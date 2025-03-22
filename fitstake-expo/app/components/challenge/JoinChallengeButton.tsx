import theme from '@/app/theme';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

interface JoinChallengeButtonProps {
  onPress: () => void;
  isJoining: boolean;
}

export const JoinChallengeButton = ({
  onPress,
  isJoining,
}: JoinChallengeButtonProps) => {
  return (
    <Pressable
      style={[styles.button, isJoining && styles.disabledButton]}
      onPress={onPress}
      disabled={isJoining}
    >
      {isJoining ? (
        <ActivityIndicator size="small" color={colors.white} />
      ) : (
        <Text style={styles.buttonText}>Join Challenge</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.md,
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default JoinChallengeButton;
