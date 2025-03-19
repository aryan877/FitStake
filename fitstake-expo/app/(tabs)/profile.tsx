import { usePrivy } from '@privy-io/expo';
import { router } from 'expo-router';
import { ChevronRight, LogOut, Medal, Settings } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import theme from '../theme';
const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

// Helper function to generate a color based on user ID
const getColorFromUserId = (id: string): string => {
  // Simple hash function for the ID to generate a hue value
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  // Use S and L to ensure readable contrast on dark background
  return `hsl(${h}, 70%, 55%)`;
};

// Component for generating avatar based on user ID
const GeneratedAvatar = ({ userId }: { userId: string }) => {
  const backgroundColor = getColorFromUserId(userId);
  const initial = userId.substring(0, 2).toUpperCase();

  return (
    <View style={[styles.avatarContainer, { backgroundColor }]}>
      <Text style={styles.avatarText}>{initial}</Text>
    </View>
  );
};

export default function ProfileScreen() {
  const { user, logout } = usePrivy();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Error', 'Failed to log out. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.profileCard}>
          {user && <GeneratedAvatar userId={user.id} />}
          <Text style={styles.name}>FitStake User</Text>
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
              <Medal color={colors.accent.warning} size={32} />
              <Text style={styles.achievementTitle}>First Win</Text>
            </View>
            {/* Add more achievements */}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuList}>
            <Pressable style={styles.menuItem}>
              <Settings size={20} color={colors.white} />
              <Text style={styles.menuText}>App Settings</Text>
              <ChevronRight size={20} color={colors.gray[400]} />
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={() => setLogoutModalVisible(true)}
            >
              <LogOut size={20} color={colors.accent.error} />
              <Text style={styles.menuTextLogout}>Logout</Text>
              <ChevronRight size={20} color={colors.gray[400]} />
            </Pressable>
            {/* Add more menu items */}
          </View>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalText}>
              Are you sure you want to log out of your account?
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.logoutButton]}
                onPress={() => {
                  setLogoutModalVisible(false);
                  handleLogout();
                }}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  profileCard: {
    margin: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    color: colors.white,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[300],
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray[700],
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  achievementItem: {
    backgroundColor: colors.gray[900],
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    width: '31%',
    ...shadows.sm,
  },
  achievementTitle: {
    color: colors.white,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  menuList: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  menuText: {
    flex: 1,
    color: colors.white,
    fontSize: fontSize.md,
  },
  menuTextLogout: {
    flex: 1,
    color: colors.accent.error,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  // Modal styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalView: {
    margin: spacing.md,
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.lg,
    width: '85%',
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  modalText: {
    fontSize: fontSize.md,
    color: colors.gray[200],
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    borderRadius: borderRadius.md,
    padding: spacing.md - 2,
    flex: 1,
    marginHorizontal: spacing.sm,
    ...shadows.sm,
  },
  cancelButton: {
    backgroundColor: colors.gray[700],
  },
  logoutButton: {
    backgroundColor: colors.accent.error,
  },
  cancelButtonText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  logoutButtonText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
});
