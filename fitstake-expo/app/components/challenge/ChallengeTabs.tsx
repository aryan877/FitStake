import theme from '@/app/theme';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const { colors, spacing, fontSize, fontWeight } = theme;

interface ChallengeTabsProps {
  activeTab: 'details' | 'leaderboard';
  onTabChange: (tab: 'details' | 'leaderboard') => void;
}

export const ChallengeTabs = ({
  activeTab,
  onTabChange,
}: ChallengeTabsProps) => {
  return (
    <View style={styles.tabsContainer}>
      <Pressable
        style={[
          styles.tabButton,
          activeTab === 'details' && styles.activeTabButton,
        ]}
        onPress={() => onTabChange('details')}
      >
        <Text
          style={[
            styles.tabButtonText,
            activeTab === 'details' && styles.activeTabText,
          ]}
        >
          Details
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.tabButton,
          activeTab === 'leaderboard' && styles.activeTabButton,
        ]}
        onPress={() => onTabChange('leaderboard')}
      >
        <Text
          style={[
            styles.tabButtonText,
            activeTab === 'leaderboard' && styles.activeTabText,
          ]}
        >
          Leaderboard
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[800],
    backgroundColor: colors.gray[900],
    justifyContent: 'center',
  },
  tabButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginHorizontal: spacing.md,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.accent.primary,
  },
  tabButtonText: {
    fontSize: fontSize.md,
    color: colors.gray[400],
    textAlign: 'center',
  },
  activeTabText: {
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
});

export default ChallengeTabs;
