import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChallengeFilters } from '../../hooks/useChallenges';
import theme from '../theme';

const { colors, spacing, borderRadius, fontSize, fontWeight } = theme;

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
  onClearFilters: () => void;
  filters: ChallengeFilters;
  setFilters: (
    filters: ChallengeFilters | ((prev: ChallengeFilters) => ChallengeFilters)
  ) => void;
}

const FilterModal = ({
  visible,
  onClose,
  onApply,
  onClearFilters,
  filters,
  setFilters,
}: FilterModalProps) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filter Challenges</Text>

          <ScrollView style={styles.modalForm}>
            <Text style={styles.inputLabel}>Status</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  filters.status === 'active' && styles.radioButtonSelected,
                ]}
                onPress={() => setFilters({ ...filters, status: 'active' })}
              >
                <Text
                  style={[
                    styles.radioText,
                    filters.status === 'active' && styles.radioTextSelected,
                  ]}
                >
                  Active
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  filters.status === 'completed' && styles.radioButtonSelected,
                ]}
                onPress={() => setFilters({ ...filters, status: 'completed' })}
              >
                <Text
                  style={[
                    styles.radioText,
                    filters.status === 'completed' && styles.radioTextSelected,
                  ]}
                >
                  Completed
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  filters.status === 'any' && styles.radioButtonSelected,
                ]}
                onPress={() => setFilters({ ...filters, status: 'any' })}
              >
                <Text
                  style={[
                    styles.radioText,
                    filters.status === 'any' && styles.radioTextSelected,
                  ]}
                >
                  Any
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Stake Amount Range (SOL)</Text>
            <View style={styles.inputRow}>
              <View style={styles.halfInput}>
                <TextInput
                  style={styles.input}
                  placeholder="Min Stake"
                  placeholderTextColor={colors.gray[500]}
                  keyboardType="decimal-pad"
                  value={
                    filters.minStake !== undefined
                      ? String(filters.minStake)
                      : ''
                  }
                  onChangeText={(text) => {
                    // Allow valid decimal input
                    if (text === '' || /^\d*\.?\d*$/.test(text)) {
                      const value = text === '' ? undefined : Number(text);
                      setFilters((prev) => ({ ...prev, minStake: value }));
                    }
                  }}
                />
              </View>
              <View style={styles.halfInput}>
                <TextInput
                  style={styles.input}
                  placeholder="Max Stake"
                  placeholderTextColor={colors.gray[500]}
                  keyboardType="decimal-pad"
                  value={
                    filters.maxStake !== undefined
                      ? String(filters.maxStake)
                      : ''
                  }
                  onChangeText={(text) => {
                    // Allow valid decimal input
                    if (text === '' || /^\d*\.?\d*$/.test(text)) {
                      const value = text === '' ? undefined : Number(text);
                      setFilters((prev) => ({ ...prev, maxStake: value }));
                    }
                  }}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Step Goal Range</Text>
            <View style={styles.inputRow}>
              <View style={styles.halfInput}>
                <TextInput
                  style={styles.input}
                  placeholder="Min Goal"
                  placeholderTextColor={colors.gray[500]}
                  keyboardType="numeric"
                  value={filters.minGoal ? String(filters.minGoal) : ''}
                  onChangeText={(text) => {
                    const value = text === '' ? undefined : parseInt(text);
                    setFilters((prev) => ({ ...prev, minGoal: value }));
                  }}
                />
              </View>
              <View style={styles.halfInput}>
                <TextInput
                  style={styles.input}
                  placeholder="Max Goal"
                  placeholderTextColor={colors.gray[500]}
                  keyboardType="numeric"
                  value={filters.maxGoal ? String(filters.maxGoal) : ''}
                  onChangeText={(text) => {
                    const value = text === '' ? undefined : parseInt(text);
                    setFilters((prev) => ({ ...prev, maxGoal: value }));
                  }}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Participants Range</Text>
            <View style={styles.inputRow}>
              <View style={styles.halfInput}>
                <TextInput
                  style={styles.input}
                  placeholder="Min Participants"
                  placeholderTextColor={colors.gray[500]}
                  keyboardType="numeric"
                  value={
                    filters.minParticipants
                      ? String(filters.minParticipants)
                      : ''
                  }
                  onChangeText={(text) => {
                    const value = text === '' ? undefined : parseInt(text);
                    setFilters((prev) => ({ ...prev, minParticipants: value }));
                  }}
                />
              </View>
              <View style={styles.halfInput}>
                <TextInput
                  style={styles.input}
                  placeholder="Max Participants"
                  placeholderTextColor={colors.gray[500]}
                  keyboardType="numeric"
                  value={
                    filters.maxParticipants
                      ? String(filters.maxParticipants)
                      : ''
                  }
                  onChangeText={(text) => {
                    const value = text === '' ? undefined : parseInt(text);
                    setFilters((prev) => ({ ...prev, maxParticipants: value }));
                  }}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Sort By</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  filters.sortBy === 'createdAt' && styles.radioButtonSelected,
                ]}
                onPress={() => setFilters({ ...filters, sortBy: 'createdAt' })}
              >
                <Text
                  style={[
                    styles.radioText,
                    filters.sortBy === 'createdAt' && styles.radioTextSelected,
                  ]}
                >
                  Newest
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  filters.sortBy === 'endTime' && styles.radioButtonSelected,
                ]}
                onPress={() => setFilters({ ...filters, sortBy: 'endTime' })}
              >
                <Text
                  style={[
                    styles.radioText,
                    filters.sortBy === 'endTime' && styles.radioTextSelected,
                  ]}
                >
                  End Time
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  filters.sortBy === 'stakeAmount' &&
                    styles.radioButtonSelected,
                ]}
                onPress={() =>
                  setFilters({ ...filters, sortBy: 'stakeAmount' })
                }
              >
                <Text
                  style={[
                    styles.radioText,
                    filters.sortBy === 'stakeAmount' &&
                      styles.radioTextSelected,
                  ]}
                >
                  Stake
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Sort Order</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  filters.sortOrder === 'desc' && styles.radioButtonSelected,
                ]}
                onPress={() => setFilters({ ...filters, sortOrder: 'desc' })}
              >
                <Text
                  style={[
                    styles.radioText,
                    filters.sortOrder === 'desc' && styles.radioTextSelected,
                  ]}
                >
                  Descending
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  filters.sortOrder === 'asc' && styles.radioButtonSelected,
                ]}
                onPress={() => setFilters({ ...filters, sortOrder: 'asc' })}
              >
                <Text
                  style={[
                    styles.radioText,
                    filters.sortOrder === 'asc' && styles.radioTextSelected,
                  ]}
                >
                  Ascending
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClearFilters}
            >
              <Text style={styles.cancelButtonText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={onApply}>
              <Text style={styles.actionButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.gray[900],
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalForm: {
    maxHeight: 500,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[300],
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.white,
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  halfInput: {
    flex: 1,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.gray[700],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    flex: 1.5,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  radioButton: {
    flex: 1,
    padding: spacing.sm,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: colors.accent.primary,
  },
  radioText: {
    fontSize: fontSize.sm,
    color: colors.gray[300],
  },
  radioTextSelected: {
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
});

export default FilterModal;
