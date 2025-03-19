import { LinearGradient } from 'expo-linear-gradient';
import { Activity, Award, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

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
            colors={['#3B82F6', '#2563EB']}
            style={styles.gradientBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.statsContent}>
              <Activity color="#fff" size={32} />
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
              <Award color="#FCD34D" size={32} />
              <Text style={styles.achievementTitle}>7 Day Streak</Text>
            </View>
            <View style={styles.achievementCard}>
              <TrendingUp color="#34D399" size={32} />
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
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  statsCard: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBg: {
    padding: 24,
  },
  statsContent: {
    gap: 12,
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 18,
    color: '#fff',
    marginTop: 8,
  },
  statsValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
  },
  achievementsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  achievementCard: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
    width: 120,
  },
  achievementTitle: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
