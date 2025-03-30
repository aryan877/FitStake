import theme from '@/app/theme';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

interface JoinChallengeButtonProps {
  onPress: () => void;
  isJoining: boolean;
  disabled?: boolean;
  hasStarted?: boolean;
}

export const JoinChallengeButton = ({
  onPress,
  isJoining,
  disabled = false,
  hasStarted = true,
}: JoinChallengeButtonProps) => {
  const isDisabled = isJoining || disabled;

  const getButtonText = () => {
    if (isJoining) return '';
    if (!hasStarted) return 'Waiting for Challenge to Start';
    return 'Join Challenge';
  };

  return (
    <Pressable
      style={[
        styles.button,
        isDisabled && styles.disabledButton,
        !hasStarted && styles.notStartedButton,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {isJoining ? (
        <ActivityIndicator size="small" color={colors.white} />
      ) : (
        <Text style={styles.buttonText}>{getButtonText()}</Text>
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
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  disabledButton: {
    opacity: 0.6,
  },
  notStartedButton: {
    backgroundColor: colors.gray[700],
  },
});

export default JoinChallengeButton;
