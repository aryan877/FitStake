import theme from '@/app/theme';
import { AlertCircle, RefreshCw, Upload } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

interface ProgressCardProps {
  progressPercentage: number;
  totalSteps: number;
  goalSteps: number;
  isCompleted: boolean;
  isEligibleForReward: boolean;
  userFailedChallenge: boolean;
  rewardClaimed: boolean;
  onSyncSteps: () => void;
  onRefreshData: () => void;
  onClaimReward: () => void;
  isSubmitting: boolean;
  isLoading: boolean;
  isClaimingReward: boolean;
}

export const ProgressCard = ({
  progressPercentage,
  totalSteps,
  goalSteps,
  isCompleted,
  isEligibleForReward,
  userFailedChallenge,
  rewardClaimed,
  onSyncSteps,
  onRefreshData,
  onClaimReward,
  isSubmitting,
  isLoading,
  isClaimingReward,
}: ProgressCardProps) => {
  const showRefreshInfo = () => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(
        'Refresh your step data without submitting',
        ToastAndroid.SHORT
      );
    } else {
      Alert.alert(
        'Refresh Steps',
        'This will refresh your step data without submitting it to the blockchain.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressBarRow}>
        <View style={styles.progressLabel}>
          <Text style={styles.progressTitle}>Your Progress</Text>
          <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage}%`,
                  backgroundColor:
                    progressPercentage >= 100
                      ? colors.accent.primary
                      : colors.accent.secondary,
                },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.progressStats}>
        <View style={styles.progressStat}>
          <View style={styles.statWithRefresh}>
            <Text style={styles.progressStatValue}>
              {totalSteps.toLocaleString()}
            </Text>
            <Pressable
              style={[
                styles.refreshButton,
                (isLoading || isSubmitting) && styles.disabledButton,
              ]}
              onPress={onRefreshData}
              disabled={isLoading || isSubmitting}
              onLongPress={showRefreshInfo}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <RefreshCw size={14} color={colors.white} />
              )}
            </Pressable>
          </View>
          <Text style={styles.progressStatLabel}>Steps Done</Text>
        </View>
        <View style={styles.progressStatDivider} />
        <View style={styles.progressStat}>
          <Text style={styles.progressStatValue}>
            {goalSteps.toLocaleString()}
          </Text>
          <Text style={styles.progressStatLabel}>Goal</Text>
        </View>
      </View>

      {!isCompleted && (
        <View style={styles.warningContainer}>
          <AlertCircle
            size={16}
            color={colors.accent.warning}
            style={styles.warningIcon}
          />
          <Text style={styles.warningText}>
            Remember to sync your steps before the challenge ends or you'll
            lose!
          </Text>
        </View>
      )}

      {!isCompleted ? (
        <Pressable
          style={[
            styles.actionButton,
            (isSubmitting || isLoading) && styles.disabledButton,
          ]}
          onPress={onSyncSteps}
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Upload
                size={16}
                color={colors.white}
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>
                {isLoading ? 'Loading Steps...' : 'Sync Steps'}
              </Text>
            </>
          )}
        </Pressable>
      ) : isEligibleForReward ? (
        <Pressable
          style={[
            styles.claimButton,
            isClaimingReward && styles.disabledButton,
          ]}
          onPress={onClaimReward}
          disabled={isClaimingReward}
        >
          {isClaimingReward ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.claimButtonText}>Claim Reward</Text>
          )}
        </Pressable>
      ) : userFailedChallenge ? (
        <View style={styles.statusBadge}>
          <Text style={styles.failedText}>Challenge Failed</Text>
        </View>
      ) : rewardClaimed ? (
        <View style={styles.statusBadge}>
          <Text style={styles.claimedText}>Reward Claimed</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray[900],
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  progressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressLabel: {
    width: 110,
  },
  progressTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  progressPercentage: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.accent.primary,
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressStat: {
    flex: 1,
    alignItems: 'center',
  },
  statWithRefresh: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  progressStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.gray[700],
    marginHorizontal: spacing.md,
  },
  progressStatValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  progressStatLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: spacing.xs / 2,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.gray[800],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  warningIcon: {
    marginTop: 2,
  },
  warningText: {
    color: colors.accent.warning,
    fontSize: fontSize.xs,
    flex: 1,
    marginLeft: spacing.xs,
    flexWrap: 'wrap',
  },
  actionButton: {
    backgroundColor: colors.accent.secondary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  refreshButton: {
    backgroundColor: colors.gray[700],
    width: 22,
    height: 22,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  claimButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  claimButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  statusBadge: {
    backgroundColor: colors.gray[800],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  failedText: {
    color: colors.accent.error,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  claimedText: {
    color: colors.accent.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default ProgressCard;
