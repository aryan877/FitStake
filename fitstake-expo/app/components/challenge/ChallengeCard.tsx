import theme from '@/app/theme';
import { formatCountdown } from '@/app/utils/dateFormatting';
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

const { colors, spacing, borderRadius, fontSize, fontWeight } = theme;

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
    formatCountdown(challenge.endTime)
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

  // Update countdown every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCountdownText(formatCountdown(challenge.endTime));
    }, 1000);

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, [challenge.endTime]);

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

  // Check if challenge is private
  const isPrivate = challenge.isPublic === false;

  return (
    <Pressable style={styles.challengeCard} onPress={handleCardPress}>
      <View style={styles.challengeCardHeader}>
        <Text style={styles.challengeCardTitle}>{challenge.title}</Text>
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

      <Text style={styles.challengeCardDesc}>{trimmedDescription}</Text>

      <View style={styles.challengeCardDetails}>
        <View style={styles.detailItem}>
          <Users size={12} color={colors.gray[400]} />
          <Text style={styles.detailText}>
            {challenge.participantCount}/{challenge.maxParticipants}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <TrendingUp size={12} color={colors.gray[400]} />
          <Text style={styles.detailText}>
            {formatSolAmount(challenge.stakeAmount)} {challenge.token}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Trophy size={12} color={colors.gray[400]} />
          <Text style={styles.detailText}>
            {challenge.goal.value.toLocaleString()} {challenge.goal.unit}
          </Text>
        </View>
      </View>

      {needsMoreParticipants && (
        <Text style={styles.joinPromptText}>
          Be one of the first to join! Challenge needs{' '}
          {challenge.minParticipants} participants.
        </Text>
      )}

      <View style={styles.challengeCardFooter}>
        <Text style={styles.challengeCardEndDate}>{countdownText}</Text>

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
              style={styles.joinButton}
              onPress={(e) => {
                e.stopPropagation(); // Prevent the card press event
                onJoin(challenge.id);
              }}
            >
              <Text style={styles.joinButtonText}>Join</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  challengeCard: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  challengeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  challengeCardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
    flex: 1,
  },
  challengeCardDesc: {
    fontSize: fontSize.sm,
    color: colors.gray[300],
    marginBottom: spacing.md,
  },
  challengeCardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    color: colors.gray[300],
    fontSize: fontSize.xs,
  },
  challengeCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeCardEndDate: {
    fontSize: fontSize.sm,
    color: colors.accent.primary,
    fontWeight: fontWeight.medium,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  joinButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  joinButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  copyButton: {
    backgroundColor: colors.gray[700],
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyButtonText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  needsParticipantsBadge: {
    backgroundColor: colors.accent.secondary,
    paddingVertical: 2,
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
  joinPromptText: {
    color: colors.accent.secondary,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  privateBadge: {
    backgroundColor: colors.gray[700],
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.gray[600],
  },
  privateBadgeText: {
    color: colors.gray[300],
    fontSize: 10,
    fontWeight: fontWeight.medium,
  },
});

export default ChallengeCard;
