import theme from '@/app/theme';
import { formatTimeDisplay, hasStarted } from '@/app/utils/dateFormatting';
import { ChallengeData } from '@/types';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Copy, TrendingUp, Trophy, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import SolanaPriceDisplay from '../SolanaPriceDisplay';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows, cards } =
  theme;

// Helper function to format SOL amounts
const formatSolAmount = (lamports: number) => {
  return (lamports / LAMPORTS_PER_SOL).toFixed(2);
};

interface ExtendedChallengeCardProps {
  challenge: ChallengeData;
  onJoin: (id: string) => void;
  isJoining: boolean;
}

const ChallengeCard = ({
  challenge,
  onJoin,
  isJoining,
}: ExtendedChallengeCardProps) => {
  const router = useRouter();
  // State to hold countdown text
  const [countdownText, setCountdownText] = useState(
    formatTimeDisplay(challenge.startTime, challenge.endTime)
  );

  // Check if challenge has started
  const [hasStartedState, setHasStartedState] = useState(
    hasStarted(challenge.startTime)
  );

  // Calculate if challenge needs more participants
  const needsMoreParticipants =
    challenge.participantCount < challenge.minParticipants;

  // Trim long descriptions
  const descriptionCharLimit = 120;
  const trimmedDescription =
    challenge.description.length > descriptionCharLimit
      ? `${challenge.description.substring(0, descriptionCharLimit)}...`
      : challenge.description;

  // Calculate SOL amount in decimal
  const solAmount = challenge.stakeAmount / LAMPORTS_PER_SOL;

  // Update countdown every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      const newHasStarted = hasStarted(challenge.startTime);
      // Update has started state in case the challenge starts during viewing
      if (newHasStarted !== hasStartedState) {
        setHasStartedState(newHasStarted);
      }
      setCountdownText(
        formatTimeDisplay(challenge.startTime, challenge.endTime)
      );
    }, 1000);

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, [challenge.startTime, challenge.endTime, hasStartedState]);

  // Handle card press
  const handleCardPress = () => {
    router.push(`/challenge/${challenge.id}`);
  };

  const handleCopyId = async (e: any) => {
    e.stopPropagation();
    try {
      await Clipboard.setStringAsync(challenge.challengeId);
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          'Challenge ID copied to clipboard',
          ToastAndroid.SHORT
        );
      }
    } catch (error) {
      console.error('Failed to copy challenge ID:', error);
    }
  };

  // Handle join button press
  const handleJoinPress = (e: any) => {
    e.stopPropagation(); // Prevent the card press event
    // Only allow joining if challenge has started
    if (hasStartedState) {
      onJoin(challenge.id);
    }
  };

  // Check if challenge is private
  const isPrivate = challenge.isPublic === false;

  return (
    <Pressable
      style={styles.challengeCard}
      onPress={handleCardPress}
      android_ripple={{ color: 'transparent' }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
        </View>
        <View style={styles.badgesContainer}>
          {isPrivate && (
            <View style={styles.privateBadge}>
              <Text style={styles.privateBadgeText}>Private</Text>
            </View>
          )}
          {needsMoreParticipants && (
            <View style={styles.needsParticipantsBadge}>
              <Users size={10} color={colors.white} />
              <Text style={styles.needsParticipantsText}>
                Needs {challenge.minParticipants - challenge.participantCount}{' '}
                more
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.challengeDescription}>{trimmedDescription}</Text>

        {needsMoreParticipants && (
          <View style={styles.joinPromptContainer}>
            <Text style={styles.joinPromptText}>
              Be one of the first to join! Challenge needs{' '}
              {challenge.minParticipants} participants.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoSection}>
          <View style={styles.iconLabelGroup}>
            <Users size={14} color={colors.accent.primary} />
            <Text style={styles.infoLabel}>Participants</Text>
          </View>
          <Text style={styles.infoValue}>
            {challenge.participantCount}/{challenge.maxParticipants}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoSection}>
          <View style={styles.iconLabelGroup}>
            <Trophy size={14} color={colors.accent.primary} />
            <Text style={styles.infoLabel}>Goal</Text>
          </View>
          <Text style={styles.infoValue}>
            {challenge.goal.value.toLocaleString()} {challenge.goal.unit}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoSection}>
          <View style={styles.iconLabelGroup}>
            <TrendingUp size={14} color={colors.accent.primary} />
            <Text style={styles.infoLabel}>Stake</Text>
          </View>
          <View style={styles.stakeContainer}>
            <Text style={styles.infoValue}>
              {formatSolAmount(challenge.stakeAmount)} {challenge.token}
            </Text>
            <SolanaPriceDisplay
              solAmount={solAmount}
              compact={true}
              variant="dark"
              showSolAmount={false}
            />
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.timeContainer}>
          <Text style={styles.timeLabel}>Time Remaining</Text>
          <Text style={styles.timeValue}>{countdownText}</Text>
        </View>

        <View style={styles.actionButtonsContainer}>
          {isPrivate && (
            <Pressable
              style={styles.copyButton}
              onPress={handleCopyId}
              android_ripple={{ color: colors.gray[700] }}
            >
              <Copy size={14} color={colors.white} />
              <Text style={styles.copyButtonText}>Copy ID</Text>
            </Pressable>
          )}

          {isJoining ? (
            <View style={styles.joinButton}>
              <ActivityIndicator size="small" color={colors.white} />
            </View>
          ) : (
            <Pressable
              style={[
                styles.joinButton,
                !hasStartedState && styles.joinButtonDisabled,
              ]}
              onPress={handleJoinPress}
              disabled={!hasStartedState}
              android_ripple={
                hasStartedState ? { color: colors.accent.primary } : undefined
              }
            >
              <Text style={styles.joinButtonText}>
                {hasStartedState ? 'Join' : 'Not Started'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  challengeCard: {
    ...cards.standard,
    marginBottom: spacing.md,
    backgroundColor: colors.surface.card,
  },
  cardHeader: {
    ...cards.header,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  challengeTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
    lineHeight: 24,
  },
  contentContainer: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  privateBadge: {
    backgroundColor: colors.gray[700],
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  privateBadgeText: {
    color: colors.gray[300],
    fontSize: 10,
    fontWeight: fontWeight.medium,
  },
  challengeDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[300],
    lineHeight: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  infoSection: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    gap: 4,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: colors.white,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    height: '70%',
    marginHorizontal: spacing.xs,
  },
  stakeContainer: {
    alignItems: 'center',
  },
  joinPromptContainer: {
    backgroundColor: 'rgba(0, 221, 95, 0.08)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.secondary,
  },
  joinPromptText: {
    color: colors.accent.secondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  cardFooter: {
    ...cards.footer,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'column',
  },
  timeLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginBottom: 2,
  },
  timeValue: {
    fontSize: fontSize.sm,
    color: colors.accent.primary,
    fontWeight: fontWeight.bold,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  joinButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 80,
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: colors.gray[700],
    opacity: 0.7,
  },
  joinButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  copyButton: {
    backgroundColor: 'rgba(64, 64, 64, 0.7)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
  },
  copyButtonText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  needsParticipantsBadge: {
    backgroundColor: colors.accent.secondary,
    paddingVertical: 4,
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
});

export default ChallengeCard;
