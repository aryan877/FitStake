import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Trophy, Users } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
            colors={['#4F46E5', '#7C3AED']}
            style={styles.gradientBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.challengeContent}>
              <Trophy color="#fff" size={32} />
              <Text style={styles.challengeTitle}>10K Steps Challenge</Text>
              <Text style={styles.challengeSubtitle}>
                Walk 10,000 steps daily for 30 days
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Users size={16} color="#fff" />
                  <Text style={styles.statText}>24 participants</Text>
                </View>
                <View style={styles.stat}>
                  <TrendingUp size={16} color="#fff" />
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
  featuredChallenge: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBg: {
    padding: 24,
  },
  challengeContent: {
    gap: 12,
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  challengeSubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: '#fff',
    fontSize: 14,
  },
  joinButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  joinButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
  },
  challengesList: {
    padding: 20,
  },
});
