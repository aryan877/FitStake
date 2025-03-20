import { usePrivy } from '@privy-io/expo';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Trophy, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { challengeApi } from '../services/api';
import theme from '../theme';
import { showErrorToast, showSuccessToast } from '../utils/errorHandling';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

interface ChallengeData {
  id: string;
  title: string;
  description: string;
  type: 'STEPS' | 'WORKOUT' | 'SLEEP' | 'CUSTOM';
  goal: {
    value: number;
    unit: string;
  };
  duration: {
    days: number;
    startDate?: string;
    endDate?: string;
  };
  stake: {
    amount: number;
    token: string;
  };
  participants: {
    did: string;
    status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
    joinedAt: string;
  }[];
  isActive: boolean;
  createdBy: string;
  poolAmount: number;
  totalParticipants: number;
  successRate?: number;
}

export default function ChallengesScreen() {
  const { user } = usePrivy();
  const [challenges, setChallenges] = useState<ChallengeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await challengeApi.getAll();

      // Handle the new API response format
      if (response.success && response.data && response.data.challenges) {
        setChallenges(response.data.challenges);
      } else {
        // If we don't have challenges array, set empty array
        setChallenges([]);
      }
    } catch (err) {
      console.error('Error fetching challenges:', err);
      setError('Failed to load challenges. Please try again later.');
      showErrorToast(err, 'Failed to load challenges');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      if (!user) {
        Alert.alert(
          'Authentication Required',
          'Please log in to join a challenge.'
        );
        return;
      }

      const response = await challengeApi.join(challengeId);
      if (response.success) {
        fetchChallenges();
        showSuccessToast('You have successfully joined the challenge!');
      }
    } catch (err) {
      console.error('Error joining challenge:', err);
      showErrorToast(err, 'Failed to join the challenge');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchChallenges();
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <Text style={styles.loadingText}>Loading challenges...</Text>
      </View>
    );
  }

  // Featured challenge is the first active challenge or null if none exist
  const featuredChallenge = challenges.length > 0 ? challenges[0] : null;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.accent.primary]}
            tintColor={colors.accent.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Active Challenges</Text>
          <Text style={styles.subtitle}>Join a challenge and earn rewards</Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={fetchChallenges}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : challenges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Trophy color={colors.gray[400]} size={48} />
            <Text style={styles.emptyText}>No active challenges found</Text>
          </View>
        ) : (
          <>
            {featuredChallenge && (
              <View style={styles.featuredChallenge}>
                <LinearGradient
                  colors={[colors.accent.primary, '#FF7043']}
                  style={styles.gradientBg}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.challengeContent}>
                    <Trophy color={colors.white} size={32} />
                    <Text style={styles.challengeTitle}>
                      {featuredChallenge.title}
                    </Text>
                    <Text style={styles.challengeSubtitle}>
                      {featuredChallenge.description}
                    </Text>
                    <View style={styles.statsRow}>
                      <View style={styles.stat}>
                        <Users size={16} color={colors.white} />
                        <Text style={styles.statText}>
                          {featuredChallenge.totalParticipants} participants
                        </Text>
                      </View>
                      <View style={styles.stat}>
                        <TrendingUp size={16} color={colors.white} />
                        <Text style={styles.statText}>
                          {featuredChallenge.poolAmount}{' '}
                          {featuredChallenge.stake.token} pool
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      style={styles.joinButton}
                      onPress={() => handleJoinChallenge(featuredChallenge.id)}
                    >
                      <Text style={styles.joinButtonText}>Join Challenge</Text>
                    </Pressable>
                  </View>
                </LinearGradient>
              </View>
            )}

            <Text style={styles.sectionTitle}>Upcoming Challenges</Text>
            <View style={styles.challengesList}>
              {challenges.slice(1).map((challenge) => (
                <View key={challenge.id} style={styles.challengeCard}>
                  <Text style={styles.challengeCardTitle}>
                    {challenge.title}
                  </Text>
                  <Text style={styles.challengeCardDesc}>
                    {challenge.description}
                  </Text>
                  <View style={styles.challengeCardFooter}>
                    <Text style={styles.challengeCardStat}>
                      {challenge.totalParticipants} participants
                    </Text>
                    <Pressable
                      style={styles.smallJoinButton}
                      onPress={() => handleJoinChallenge(challenge.id)}
                    >
                      <Text style={styles.smallJoinButtonText}>Join</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    paddingTop: spacing.xxl + spacing.xl,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.gray[400],
  },
  loadingText: {
    color: colors.gray[300],
    marginTop: spacing.md,
    fontSize: fontSize.md,
  },
  errorContainer: {
    margin: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  errorText: {
    color: colors.accent.error,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.gray[700],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
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
  featuredChallenge: {
    margin: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  gradientBg: {
    padding: spacing.lg,
  },
  challengeContent: {
    gap: spacing.sm,
  },
  challengeTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginTop: spacing.sm,
  },
  challengeSubtitle: {
    fontSize: fontSize.md,
    color: colors.gray[100],
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  statText: {
    color: colors.white,
    fontSize: fontSize.sm,
  },
  joinButton: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.sm,
  },
  joinButtonText: {
    color: colors.accent.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  challengesList: {
    padding: spacing.md,
  },
  challengeCard: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  challengeCardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  challengeCardDesc: {
    fontSize: fontSize.sm,
    color: colors.gray[300],
    marginBottom: spacing.md,
  },
  challengeCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeCardStat: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
  smallJoinButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  smallJoinButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
