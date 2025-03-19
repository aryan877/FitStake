import { ChevronRight, Medal, Settings } from 'lucide-react-native';
import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.profileCard}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
            }}
            style={styles.avatar}
          />
          <Text style={styles.name}>John Doe</Text>
          <Text style={styles.email}>john@example.com</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Challenges</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>45.5</Text>
              <Text style={styles.statLabel}>SOL Earned</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            <View style={styles.achievementItem}>
              <Medal color="#FCD34D" size={32} />
              <Text style={styles.achievementTitle}>First Win</Text>
            </View>
            {/* Add more achievements */}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuList}>
            <Pressable style={styles.menuItem}>
              <Settings size={20} color="#fff" />
              <Text style={styles.menuText}>App Settings</Text>
              <ChevronRight size={20} color="#6B7280" />
            </Pressable>
            {/* Add more menu items */}
          </View>
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
  profileCard: {
    margin: 20,
    padding: 24,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#374151',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementItem: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '31%',
  },
  achievementTitle: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  menuList: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
});
