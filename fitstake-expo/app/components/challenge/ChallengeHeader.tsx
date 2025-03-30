import theme from '@/app/theme';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const { colors, spacing, fontSize, fontWeight } = theme;

interface ChallengeHeaderProps {
  title: string;
  timeRemaining: string;
  onBack: () => void;
}

export const ChallengeHeader = ({
  title,
  timeRemaining,
  onBack,
}: ChallengeHeaderProps) => {
  // Determine if this is a "Starts in" countdown based on the string content
  const isStartingCountdown = timeRemaining.startsWith('Starts in');

  return (
    <View style={styles.header}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <ArrowLeft size={20} color={colors.white} />
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
        {title}
      </Text>
      <View style={styles.timeRemainingContainer}>
        <Text
          style={[
            styles.timeRemaining,
            isStartingCountdown && styles.startsInText,
          ]}
        >
          {timeRemaining}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray[900],
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  backButton: {
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeRemainingContainer: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  timeRemaining: {
    fontSize: fontSize.sm,
    color: colors.accent.primary,
    fontWeight: fontWeight.medium,
  },
  startsInText: {
    color: colors.accent.secondary,
  },
});

export default ChallengeHeader;
