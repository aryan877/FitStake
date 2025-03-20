import { usePrivy } from '@privy-io/expo';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { router } from 'expo-router';
import {
  ActivitySquare,
  ChevronRight,
  Footprints,
  LogOut,
  Medal,
  Settings,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useHealthConnect } from '../../hooks/useHealthConnect';
import theme from '../theme';

// Initialize dayjs plugins
dayjs.extend(relativeTime);

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

// Helper function to format date string using dayjs
const formatDateString = (dateString: string) => {
  // First try to parse with dayjs directly
  let date = dayjs(dateString);

  // If invalid, try to parse assuming MM/DD/YYYY format (common in US locale)
  if (!date.isValid()) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      // American format: MM/DD/YYYY
      date = dayjs(
        `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
      );
    }
  }

  // If still invalid, return a fallback
  if (!date.isValid()) {
    return 'Unknown date';
  }

  const today = dayjs();

  if (date.isSame(today, 'day')) {
    return 'Today';
  } else if (date.isSame(today.subtract(1, 'day'), 'day')) {
    return 'Yesterday';
  }

  // Format as "Feb 13"
  return date.format('MMM D');
};

// Steps data component
const StepsDataCard = () => {
  const {
    isAndroid,
    stepsData,
    loading,
    error,
    hasPermissions,
    refreshStepsData,
    setupHealthConnect,
  } = useHealthConnect();

  useEffect(() => {
    console.log('StepsDataCard mounted, isAndroid:', isAndroid);
    console.log('hasPermissions:', hasPermissions);
    console.log('stepsData:', stepsData);
    console.log('loading:', loading);
    console.log('error:', error);

    if (isAndroid) {
      console.log('Manually triggering setupHealthConnect from StepsDataCard');
      setupHealthConnect();
    }
  }, [isAndroid, hasPermissions, loading, error, setupHealthConnect]);

  if (!isAndroid) {
    return (
      <View style={styles.stepsCard}>
        <View style={styles.stepsCardHeader}>
          <Footprints color={colors.accent.primary} size={24} />
          <Text style={styles.stepsCardTitle}>Steps Data</Text>
        </View>
        <Text style={styles.stepsCardSubtitle}>
          Health Connect is only available on Android devices.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.stepsCard}>
        <View style={styles.stepsCardHeader}>
          <Footprints color={colors.accent.primary} size={24} />
          <Text style={styles.stepsCardTitle}>Steps Data</Text>
        </View>
        <ActivityIndicator
          color={colors.accent.primary}
          size="large"
          style={styles.loader}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stepsCard}>
        <View style={styles.stepsCardHeader}>
          <Footprints color={colors.accent.primary} size={24} />
          <Text style={styles.stepsCardTitle}>Steps Data</Text>
        </View>
        <Text style={styles.stepsCardError}>{error}</Text>
        <Pressable
          style={styles.actionButton}
          onPress={() => refreshStepsData()}
        >
          <Text style={styles.actionButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!hasPermissions) {
    return (
      <View style={styles.stepsCard}>
        <View style={styles.stepsCardHeader}>
          <Footprints color={colors.accent.primary} size={24} />
          <Text style={styles.stepsCardTitle}>Steps Data</Text>
        </View>
        <Text style={styles.stepsCardSubtitle}>
          Permission required to access steps data
        </Text>
        <Pressable
          style={styles.actionButton}
          onPress={() => refreshStepsData()}
        >
          <Text style={styles.actionButtonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.stepsCard}>
      <View style={styles.stepsCardHeader}>
        <Footprints color={colors.accent.primary} size={24} />
        <Text style={styles.stepsCardTitle}>Steps Data</Text>
      </View>

      {stepsData.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <ActivitySquare color={colors.gray[400]} size={40} />
          <Text style={styles.stepsCardSubtitle}>No steps data available</Text>
        </View>
      ) : (
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsScrollContainer}
          >
            {stepsData.map((data, index) => (
              <View key={index} style={styles.stepsDayCard}>
                <Text style={styles.stepsDate}>
                  {formatDateString(data.date)}
                </Text>
                <View style={styles.stepsCountContainer}>
                  <Footprints
                    size={24}
                    color={
                      data.count > 0 ? colors.accent.primary : colors.gray[600]
                    }
                  />
                  <Text style={styles.stepsCountText}>{data.count}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <Pressable
            style={styles.refreshButton}
            onPress={() => refreshStepsData()}
          >
            <Text style={styles.refreshButtonText}>Refresh Data</Text>
          </Pressable>
        </View>
      )}
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

        {/* Health Connect Steps Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Data</Text>
          <StepsDataCard />
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
  // Steps data card styles
  stepsCard: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
    marginBottom: spacing.md,
  },
  stepsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepsCardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginLeft: spacing.sm,
  },
  stepsCardSubtitle: {
    fontSize: fontSize.md,
    color: colors.gray[300],
    marginBottom: spacing.sm,
  },
  stepsCardError: {
    fontSize: fontSize.md,
    color: colors.accent.error,
    marginBottom: spacing.sm,
  },
  actionButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  cardsScrollContainer: {
    paddingRight: spacing.md,
    paddingBottom: spacing.xs,
  },
  stepsDayCard: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
    width: 120,
    ...shadows.sm,
  },
  stepsDate: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.accent.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  stepsCountContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsCountText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginTop: spacing.xs,
  },
  refreshButton: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  refreshButtonText: {
    color: colors.accent.primary,
    fontWeight: fontWeight.medium,
  },
  loader: {
    marginVertical: spacing.lg,
  },
});
