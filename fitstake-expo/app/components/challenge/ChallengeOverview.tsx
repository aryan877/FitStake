import theme from '@/app/theme';
import { CalendarDays, Copy, Globe, Lock, Share2 } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import SolanaPriceDisplay from '../SolanaPriceDisplay';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

interface ChallengeOverviewProps {
  goalValue: number;
  goalUnit: string;
  stakeAmount: string;
  solAmount?: number;
  token: string;
  participantCount: number;
  maxParticipants: number;
  isCompleted: boolean;
  isActive: boolean;
  startDate: string;
  endDate: string;
  timeRemaining: string;
  isPublic: boolean;
  onCopyId?: () => void;
  challengeId?: string;
}

const ChallengeOverview = ({
  goalValue,
  goalUnit,
  stakeAmount,
  solAmount,
  token,
  participantCount,
  maxParticipants,
  isCompleted,
  isActive,
  startDate,
  endDate,
  timeRemaining,
  isPublic,
  onCopyId,
  challengeId,
}: ChallengeOverviewProps) => {
  // Determine if this is a "Starts in" countdown
  const isStartingCountdown = timeRemaining.startsWith('Starts in');

  return (
    <View style={styles.container}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          Overview
        </Text>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Goal</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {goalValue.toLocaleString()} {goalUnit}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Stake</Text>
          <View>
            <Text style={styles.detailValue} numberOfLines={1}>
              {stakeAmount} {token}
            </Text>
            {solAmount !== undefined && (
              <View style={styles.usdEquivalent}>
                <SolanaPriceDisplay
                  solAmount={solAmount}
                  variant="secondary"
                  showSolAmount={false}
                />
              </View>
            )}
          </View>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Participants</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {participantCount}/{maxParticipants}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Status</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isCompleted
                    ? colors.accent.warning
                    : isActive
                    ? colors.accent.primary
                    : colors.gray[400],
                },
              ]}
            />
            <Text style={styles.detailValue} numberOfLines={1}>
              {isCompleted ? 'Completed' : isActive ? 'Active' : 'Pending'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.dateSection}>
        <View style={styles.dateHeader}>
          <CalendarDays size={16} color={colors.gray[400]} />
          <Text style={styles.dateSectionTitle} numberOfLines={1}>
            Challenge Period
          </Text>
        </View>

        <View style={styles.dates}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Starts</Text>
            <Text
              style={styles.dateValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {startDate}
            </Text>
          </View>

          <View style={styles.dateDivider} />

          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Ends</Text>
            <Text
              style={styles.dateValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {endDate}
            </Text>
          </View>
        </View>

        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>
            {isStartingCountdown ? 'Starting:' : 'Remaining:'}
          </Text>
          <Text
            style={[
              styles.timerValue,
              isStartingCountdown && styles.startsInTimerValue,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {timeRemaining}
          </Text>
        </View>
      </View>

      {isPublic ? (
        <View style={styles.visibilitySection}>
          <View style={styles.visibilityHeader}>
            <Globe size={16} color={colors.accent.primary} />
            <Text style={styles.visibilityText} numberOfLines={1}>
              Public Challenge
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.privateSection}>
          <View style={styles.privateHeader}>
            <Lock size={16} color={colors.accent.secondary} />
            <Text style={styles.visibilityText} numberOfLines={1}>
              Private Challenge
            </Text>
          </View>

          {onCopyId && challengeId && (
            <View style={styles.shareSection}>
              <View style={styles.shareHintContainer}>
                <Share2 size={14} color={colors.gray[300]} />
                <Text style={styles.shareHintText}>
                  Share this ID with friends to invite them
                </Text>
              </View>

              <Pressable style={styles.idContainer} onPress={onCopyId}>
                <Text style={styles.idValue} numberOfLines={1}>
                  {challengeId}
                </Text>
                <View style={styles.copyButton}>
                  <Copy size={14} color={colors.white} />
                </View>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default ChallengeOverview;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
    flex: 1,
    marginRight: spacing.sm,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  detailItem: {
    width: '48%',
    padding: spacing.md,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginBottom: spacing.xs,
  },
  detailValue: {
    fontSize: fontSize.md,
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
    flexShrink: 0,
  },
  dateSection: {
    backgroundColor: colors.gray[800],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dateSectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[300],
    marginLeft: spacing.xs,
    flex: 1,
  },
  dates: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginBottom: spacing.xs / 2,
  },
  dateValue: {
    fontSize: fontSize.md,
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  timerContainer: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  timerLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginRight: spacing.xs,
  },
  timerValue: {
    fontSize: fontSize.sm,
    color: colors.accent.primary,
    fontWeight: fontWeight.medium,
  },
  startsInTimerValue: {
    color: colors.accent.secondary,
  },
  dateDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.gray[700],
    marginHorizontal: spacing.md,
    flexShrink: 0,
  },
  visibilitySection: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.primary,
  },
  privateSection: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.secondary,
    overflow: 'hidden',
  },
  privateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[700],
  },
  visibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  visibilityText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.xs,
    flex: 1,
  },
  shareSection: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.md,
    margin: spacing.sm,
    marginTop: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  shareHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[800],
  },
  shareHintText: {
    color: colors.gray[300],
    fontSize: fontSize.xs,
    marginLeft: spacing.xs,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  idValue: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  copyButton: {
    backgroundColor: colors.accent.secondary,
    padding: spacing.xs,
    borderRadius: borderRadius.full,
  },
  usdEquivalent: {
    marginTop: 2,
  },
});
