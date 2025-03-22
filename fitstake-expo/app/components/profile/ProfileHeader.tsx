import theme from '@/app/theme';
import { Edit } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { colors } = theme;

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

interface ProfileHeaderProps {
  username: string;
  loading: boolean;
  onEditUsername: () => void;
}

const ProfileHeader = ({
  username,
  loading,
  onEditUsername,
}: ProfileHeaderProps) => {
  return (
    <View style={styles.profileHeader}>
      <GeneratedAvatar username={username} />
      {loading ? (
        <ActivityIndicator
          color={colors.accent.primary}
          style={styles.profileLoading}
        />
      ) : (
        <View style={styles.usernameContainer}>
          <Text style={styles.name}>{username}</Text>
          <Pressable
            onPress={onEditUsername}
            style={styles.editButton}
            hitSlop={10}
          >
            <Edit size={16} color={colors.accent.primary} />
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginRight: 8,
  },
  editButton: {
    padding: 4,
  },
  profileLoading: {
    marginLeft: 16,
  },
});

export default ProfileHeader;
