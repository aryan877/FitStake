import { Plus, Trophy } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import theme from '../theme';

const { colors, spacing, borderRadius, fontSize, fontWeight } = theme;

interface CreateChallengeCardProps {
  onPress: () => void;
}

const CreateChallengeCard = ({ onPress }: CreateChallengeCardProps) => {
  return (
    <TouchableOpacity
      style={styles.createChallengeCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.createChallengeContent}>
        <View style={styles.trophyIconContainer}>
          <Trophy size={28} color={colors.accent.primary} />
        </View>
        <View style={styles.createChallengeTextContainer}>
          <Text style={styles.createChallengeTitle}>Create Challenge</Text>
          <Text style={styles.createChallengeText}>
            Start a new fitness challenge with friends
          </Text>
        </View>
      </View>
      <View style={styles.createButtonContainer}>
        <View style={styles.createButton}>
          <Plus size={16} color={colors.white} />
          <Text style={styles.createButtonText}>Create New Challenge</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  createChallengeCard: {
    margin: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.lg,
  },
  createChallengeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  trophyIconContainer: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.md,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  createChallengeTextContainer: {
    flex: 1,
  },
  createChallengeTitle: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  createChallengeText: {
    color: colors.gray[400],
    fontSize: fontSize.sm,
  },
  createButtonContainer: {
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    width: '100%',
  },
  createButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
});

export default CreateChallengeCard;
