import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Trophy, Users } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import theme from '../theme';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

export default function ChallengesScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Active Challenges</Text>
          <Text style={styles.subtitle}>Join a challenge and earn rewards</Text>
        </View>

        <View style={styles.featuredChallenge}>
          <LinearGradient
            colors={[colors.accent.primary, '#FF7043']}
            style={styles.gradientBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.challengeContent}>
              <Trophy color={colors.white} size={32} />
              <Text style={styles.challengeTitle}>10K Steps Challenge</Text>
              <Text style={styles.challengeSubtitle}>
                Walk 10,000 steps daily for 30 days
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Users size={16} color={colors.white} />
                  <Text style={styles.statText}>24 participants</Text>
                </View>
                <View style={styles.stat}>
                  <TrendingUp size={16} color={colors.white} />
                  <Text style={styles.statText}>300 SOL pool</Text>
                </View>
              </View>
              <Pressable style={styles.joinButton}>
                <Text style={styles.joinButtonText}>Join Challenge</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.sectionTitle}>Upcoming Challenges</Text>
        <View style={styles.challengesList}>
          {/* Add more challenge cards here */}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
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
});
