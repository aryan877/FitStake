import { usePrivy } from '@privy-io/expo';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { router } from 'expo-router';
import {
  ActivitySquare,
  ChevronRight,
  Edit,
  Footprints,
  LogOut,
  Medal,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useHealthConnect } from '../../hooks/useHealthConnect';
import { authApi } from '../services/api';
import theme from '../theme';
import {
  handleApiError,
  showErrorToast,
  showSuccessToast,
} from '../utils/errorHandling';

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
const GeneratedAvatar = ({ username }: { username: string }) => {
  const backgroundColor = getColorFromUserId(username);
  const initial = username.substring(0, 1).toUpperCase();

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

  const ConnectionComponent = () => {
    const handleConnect = () => {
      console.log('Connecting to Health Connect...');
      setupHealthConnect();
    };

    return (
      <View style={styles.stepsCard}>
        <View style={styles.stepsCardHeader}>
          <Footprints color={colors.accent.primary} size={24} />
          <Text style={styles.stepsCardTitle}>Steps Data</Text>
        </View>
        <View style={styles.connectionContent}>
          <View style={styles.connectionAlertContent}>
            <Text style={styles.connectionAlertTitle}>
              Connect to Health Connect
            </Text>
            <Text style={styles.connectionAlertText}>
              FitStake needs access to Health Connect to track your steps. Your
              fitness apps should be synced with Health Connect separately.
            </Text>
            <Pressable
              style={styles.connectionAlertButton}
              onPress={handleConnect}
            >
              <Text style={styles.connectionAlertButtonText}>Connect Now</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  useEffect(() => {
    if (isAndroid) {
      setupHealthConnect();
    }
  }, [isAndroid, setupHealthConnect]);

  // iOS specific view
  if (!isAndroid) {
    return (
      <View style={styles.stepsCard}>
        <View style={styles.stepsCardHeader}>
          <Footprints color={colors.accent.primary} size={24} />
          <Text style={styles.stepsCardTitle}>Steps Data</Text>
        </View>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.stepsCardSubtitle}>Apple Health Integration</Text>
          <Text style={styles.stepsCardNote}>Coming soon to iOS devices</Text>
        </View>
      </View>
    );
  }

  // Show connection component if not connected
  if (!hasPermissions) {
    return <ConnectionComponent />;
  }

  // Loading state
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

  // Error state
  if (error) {
    return (
      <View style={styles.stepsCard}>
        <View style={styles.stepsCardHeader}>
          <Footprints color={colors.accent.primary} size={24} />
          <Text style={styles.stepsCardTitle}>Steps Data</Text>
        </View>
        <Text style={styles.stepsCardError}>{error}</Text>
      </View>
    );
  }

  // Connected with data
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
          <Pressable
            style={styles.refreshButton}
            onPress={() => refreshStepsData()}
          >
            <Text style={styles.refreshButtonText}>Refresh Data</Text>
          </Pressable>
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
  const [username, setUsername] = useState('FitStake User');
  const [loading, setLoading] = useState(true);
  const [editUsernameModalVisible, setEditUsernameModalVisible] =
    useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    // Fetch user profile data when component mounts
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const profileData = await authApi.getUserProfile();
        if (profileData?.data?.username) {
          setUsername(profileData.data.username);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        showErrorToast(error, 'Failed to load your profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
      showErrorToast(error, 'Failed to log out');
    }
  };

  const openEditUsernameModal = () => {
    setNewUsername(username);
    setUsernameError('');
    setEditUsernameModalVisible(true);
  };

  const handleUpdateUsername = async () => {
    // Skip API call if username is unchanged
    if (newUsername === username) {
      setEditUsernameModalVisible(false);
      return;
    }

    try {
      setIsUpdatingUsername(true);
      setUsernameError('');

      const response = await authApi.updateUsername(newUsername);

      if (response?.data?.success) {
        // Update local state with new username
        setUsername(response.data.username);
        setEditUsernameModalVisible(false);
        showSuccessToast('Username updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating username:', error);

      const errorMessage = handleApiError(error, 'Failed to update username');
      setUsernameError(errorMessage);
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.profileCard}>
          {user && <GeneratedAvatar username={username} />}
          {loading ? (
            <ActivityIndicator
              color={colors.accent.primary}
              style={styles.profileLoading}
            />
          ) : (
            <View style={styles.usernameContainer}>
              <Text style={styles.name}>{username}</Text>
              <Pressable
                onPress={openEditUsernameModal}
                style={styles.editButton}
              >
                <Edit size={16} color={colors.accent.primary} />
              </Pressable>
            </View>
          )}
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

      {/* Edit Username Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={editUsernameModalVisible}
        onRequestClose={() => setEditUsernameModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Edit Username</Text>
            <TextInput
              style={styles.textInput}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Enter new username"
              placeholderTextColor={colors.gray[400]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {usernameError ? (
              <Text style={styles.errorText}>{usernameError}</Text>
            ) : null}
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditUsernameModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateUsername}
                disabled={isUpdatingUsername}
              >
                {isUpdatingUsername ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
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
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  editButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
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
  connectionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  connectionAlertIconContainer: {
    backgroundColor: colors.gray[700],
    borderRadius: borderRadius.full,
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  connectionAlertContent: {
    flex: 1,
  },
  connectionAlertTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  connectionAlertText: {
    fontSize: fontSize.md,
    color: colors.gray[300],
    marginBottom: spacing.md,
  },
  connectionAlertButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  connectionAlertButtonText: {
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  iosInfoContainer: {
    marginTop: spacing.md,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  stepsCardNote: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  profileLoading: {
    marginTop: spacing.md,
  },
  textInput: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.white,
    width: '100%',
    fontSize: fontSize.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.accent.error,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: colors.accent.primary,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
});
