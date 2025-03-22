import { usePrivy } from '@privy-io/expo';
import { router } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Badge, UserStats } from '../../types/user';
import BadgesCard from '../components/profile/BadgesCard';
import ProfileHeader from '../components/profile/ProfileHeader';
import StatsCard from '../components/profile/StatsCard';
import StepsDataCard from '../components/profile/StepsDataCard';
import { authApi } from '../services/api';
import theme from '../theme';
import { handleApiError, showSuccessToast } from '../utils/errorHandling';

const { colors, spacing, borderRadius, fontSize, fontWeight, shadows } = theme;

interface BadgeWithDetails extends Badge {
  earnedAt: Date;
}

export default function ProfileScreen() {
  const { user, logout } = usePrivy();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<BadgeWithDetails[] | null>(null);

  const isAuthenticated = !!user;

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [isAuthenticated]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await authApi.getUserProfile();
      const { username, stats, badges } = response.data || {};

      setUsername(username || 'User');
      setStats(stats || null);

      if (badges && badges.length > 0) {
        const badgesWithDetails: BadgeWithDetails[] = badges.map(
          (badge: any) => ({
            ...badge,
            earnedAt: new Date(badge.earnedAt || Date.now()),
          })
        );
        setBadges(badgesWithDetails);
      } else {
        setBadges(null);
      }
    } catch (error) {
      handleApiError(error, 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchUserProfile();
      showSuccessToast('Profile refreshed');
    } catch (error) {
      handleApiError(error, 'Failed to refresh profile');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const openEditUsernameModal = () => {
    setNewUsername(username);
    setShowModal(true);
  };

  const handleUpdateUsername = async () => {
    try {
      await authApi.updateUsername(newUsername);
      setUsername(newUsername);
      setShowModal(false);
      showSuccessToast('Username updated successfully');
    } catch (error) {
      handleApiError(error, 'Failed to update username');
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>
          You need to connect your wallet to view your profile
        </Text>
        <Pressable
          style={styles.connectButton}
          onPress={() => router.push('/')}
        >
          <Text style={styles.connectButtonText}>Connect Wallet</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
            colors={[colors.accent.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your profile</Text>
        </View>

        <View style={styles.contentContainer}>
          {/* Profile Header */}
          <View style={styles.card}>
            <ProfileHeader
              username={username}
              loading={loading}
              onEditUsername={openEditUsernameModal}
            />
          </View>

          <StatsCard stats={stats} badgesCount={badges ? badges.length : 0} />

          {/* Badges Card */}
          <BadgesCard badges={badges} />

          <StepsDataCard />

          {/* Logout Button */}
          <View style={styles.logoutSection}>
            <Pressable
              style={styles.logoutButton}
              onPress={handleLogout}
              android_ripple={{ color: colors.gray[700] }}
            >
              <LogOut size={20} color={colors.accent.error} />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Edit Username Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Username</Text>
            <TextInput
              style={styles.modalInput}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Enter new username"
              placeholderTextColor="#666"
            />
            <View style={styles.modalButtonContainer}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateUsername}
              >
                <Text style={styles.saveButtonText}>Save</Text>
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
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    padding: spacing.md,
    paddingTop: spacing.xxl + spacing.xl,
  },
  card: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
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
  connectButton: {
    backgroundColor: colors.accent.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    margin: spacing.md,
  },
  connectButtonText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.md,
  },
  logoutSection: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  logoutButtonText: {
    fontSize: fontSize.md,
    color: colors.accent.error,
    flex: 1,
    marginLeft: spacing.sm,
  },
  adminButton: {
    backgroundColor: '#581c87',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  adminButtonText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.md,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  modalInput: {
    width: '100%',
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[600],
    borderRadius: borderRadius.lg,
    color: colors.white,
    marginBottom: spacing.md,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray[700],
  },
  saveButton: {
    backgroundColor: colors.accent.primary,
  },
  cancelButtonText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
});
