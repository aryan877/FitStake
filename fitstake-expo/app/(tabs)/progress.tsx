import { LinearGradient } from 'expo-linear-gradient';
import { Activity, Award, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import theme from '../theme';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

export default function ProgressScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Progress</Text>
          <Text style={styles.subtitle}>Track your active challenges</Text>
        </View>

        <View style={styles.statsCard}>
          <LinearGradient
            colors={[colors.accent.primary, '#FF7043']}
            style={styles.gradientBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.statsContent}>
              <Activity color={colors.white} size={32} />
              <Text style={styles.statsTitle}>Today's Activity</Text>
              <Text style={styles.statsValue}>8,432 steps</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '84%' }]} />
              </View>
              <Text style={styles.progressText}>84% of daily goal</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.achievementCard}>
              <Award color={colors.accent.warning} size={32} />
              <Text style={styles.achievementTitle}>7 Day Streak</Text>
            </View>
            <View style={styles.achievementCard}>
              <TrendingUp color={colors.accent.secondary} size={32} />
              <Text style={styles.achievementTitle}>Goal Crusher</Text>
            </View>
            {/* Add more achievement cards */}
          </ScrollView>
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
  statsCard: {
    margin: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  gradientBg: {
    padding: spacing.lg,
  },
  statsContent: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: fontSize.lg,
    color: colors.white,
    marginTop: spacing.sm,
  },
  statsValue: {
    fontSize: 36,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
  },
  progressText: {
    color: colors.white,
    fontSize: fontSize.sm,
  },
  achievementsSection: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  achievementCard: {
    backgroundColor: colors.gray[900],
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginRight: spacing.sm,
    width: 120,
    ...shadows.sm,
  },
  achievementTitle: {
    color: colors.white,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
