import theme from '@/app/theme';
import { ChallengeFilters, FilterModalProps } from '@/types';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { colors, spacing, borderRadius, fontSize, fontWeight } = theme;

const FilterModal = ({
  visible,
  onClose,
  onApply,
  onClearFilters,
  filters,
  setFilters,
}: FilterModalProps) => {
  // State to track input values as strings for better UX
  const [minStakeInput, setMinStakeInput] = useState<string>(
    filters.minStake !== undefined ? String(filters.minStake) : ''
  );
  const [maxStakeInput, setMaxStakeInput] = useState<string>(
    filters.maxStake !== undefined ? String(filters.maxStake) : ''
  );
  const [minGoalInput, setMinGoalInput] = useState<string>(
    filters.minGoal !== undefined ? String(filters.minGoal) : ''
  );
  const [maxGoalInput, setMaxGoalInput] = useState<string>(
    filters.maxGoal !== undefined ? String(filters.maxGoal) : ''
  );
  const [minParticipantsInput, setMinParticipantsInput] = useState<string>(
    filters.minParticipants !== undefined ? String(filters.minParticipants) : ''
  );
  const [maxParticipantsInput, setMaxParticipantsInput] = useState<string>(
    filters.maxParticipants !== undefined ? String(filters.maxParticipants) : ''
  );

  // Update local state when filters change
  useEffect(() => {
    setMinStakeInput(
      filters.minStake !== undefined ? String(filters.minStake) : ''
    );
    setMaxStakeInput(
      filters.maxStake !== undefined ? String(filters.maxStake) : ''
    );
    setMinGoalInput(
      filters.minGoal !== undefined ? String(filters.minGoal) : ''
    );
    setMaxGoalInput(
      filters.maxGoal !== undefined ? String(filters.maxGoal) : ''
    );
    setMinParticipantsInput(
      filters.minParticipants !== undefined
        ? String(filters.minParticipants)
        : ''
    );
    setMaxParticipantsInput(
      filters.maxParticipants !== undefined
        ? String(filters.maxParticipants)
        : ''
    );
  }, [filters]);

  // Handle applying filters with conversion from string to number
  const handleApply = () => {
    const updatedFilters = { ...filters };

    // Convert string inputs to numbers when applying
    if (minStakeInput === '') {
      updatedFilters.minStake = undefined;
    } else {
      const minValue = parseFloat(minStakeInput);
      if (!isNaN(minValue) && minValue >= 0) {
        updatedFilters.minStake = minValue;
      }
    }

    if (maxStakeInput === '') {
      updatedFilters.maxStake = undefined;
    } else {
      const maxValue = parseFloat(maxStakeInput);
      if (!isNaN(maxValue) && maxValue >= 0) {
        updatedFilters.maxStake = maxValue;
      }
    }

    // Handle Goal inputs
    if (minGoalInput === '') {
      updatedFilters.minGoal = undefined;
    } else {
      const minGoal = parseInt(minGoalInput);
      if (!isNaN(minGoal) && minGoal >= 0) {
        updatedFilters.minGoal = minGoal;
      }
    }

    if (maxGoalInput === '') {
      updatedFilters.maxGoal = undefined;
    } else {
      const maxGoal = parseInt(maxGoalInput);
      if (!isNaN(maxGoal) && maxGoal >= 0) {
        updatedFilters.maxGoal = maxGoal;
      }
    }

    // Handle Participants inputs
    if (minParticipantsInput === '') {
      updatedFilters.minParticipants = undefined;
    } else {
      const minParticipants = parseInt(minParticipantsInput);
      if (!isNaN(minParticipants) && minParticipants >= 0) {
        updatedFilters.minParticipants = minParticipants;
      }
    }

    if (maxParticipantsInput === '') {
      updatedFilters.maxParticipants = undefined;
    } else {
      const maxParticipants = parseInt(maxParticipantsInput);
      if (!isNaN(maxParticipants) && maxParticipants >= 0) {
        updatedFilters.maxParticipants = maxParticipants;
      }
    }

    setFilters(updatedFilters);
    onApply();
  };

  // Handle clearing filters
  const handleClearFilters = () => {
    // Clear the local state inputs
    setMinStakeInput('');
    setMaxStakeInput('');
    setMinGoalInput('');
    setMaxGoalInput('');
    setMinParticipantsInput('');
    setMaxParticipantsInput('');

    // Create a default filters object based on the current visibility
    const defaultFilters: ChallengeFilters = {
      status: 'active',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      visibility: filters.visibility, // Maintain current visibility setting
      searchText: filters.searchText, // Maintain current search text
      // Explicitly set numeric filters to undefined
      minStake: undefined,
      maxStake: undefined,
      minGoal: undefined,
      maxGoal: undefined,
      minParticipants: undefined,
      maxParticipants: undefined,
    };

    // Update filters state with default values
    setFilters(defaultFilters);

    // Call the parent onClearFilters function
    onClearFilters();
  };

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
                  placeholder="Min Stake (SOL)"
                  placeholderTextColor={colors.gray[500]}
                  keyboardType="decimal-pad"
                  value={minStakeInput}
                  onChangeText={(text) => {
                    // Allow valid decimal input including leading zeros
                    if (text === '' || /^(0|[1-9]\d*)?\.?\d*$/.test(text)) {
                      setMinStakeInput(text);
                    }
                  }}
                />
              </View>
              <View style={styles.halfInput}>
                <TextInput
                  style={styles.input}
                  placeholder="Max Stake (SOL)"
                  placeholderTextColor={colors.gray[500]}
                  keyboardType="decimal-pad"
                  value={maxStakeInput}
                  onChangeText={(text) => {
                    // Allow valid decimal input including leading zeros
                    if (text === '' || /^(0|[1-9]\d*)?\.?\d*$/.test(text)) {
                      setMaxStakeInput(text);
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
                  value={minGoalInput}
                  onChangeText={(text) => {
                    // Only allow positive numbers
                    if (text === '' || /^\d*$/.test(text)) {
                      setMinGoalInput(text);
                    }
                  }}
                />
              </View>
              <View style={styles.halfInput}>
                <TextInput
                  style={styles.input}
                  placeholder="Max Goal"
                  placeholderTextColor={colors.gray[500]}
                  keyboardType="numeric"
                  value={maxGoalInput}
                  onChangeText={(text) => {
                    // Only allow positive numbers
                    if (text === '' || /^\d*$/.test(text)) {
                      setMaxGoalInput(text);
                    }
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
                  value={minParticipantsInput}
                  onChangeText={(text) => {
                    // Only allow positive numbers
                    if (text === '' || /^\d*$/.test(text)) {
                      setMinParticipantsInput(text);
                    }
                  }}
                />
              </View>
              <View style={styles.halfInput}>
                <TextInput
                  style={styles.input}
                  placeholder="Max Participants"
                  placeholderTextColor={colors.gray[500]}
                  keyboardType="numeric"
                  value={maxParticipantsInput}
                  onChangeText={(text) => {
                    // Only allow positive numbers
                    if (text === '' || /^\d*$/.test(text)) {
                      setMaxParticipantsInput(text);
                    }
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
              onPress={handleClearFilters}
            >
              <Text style={styles.cancelButtonText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleApply}>
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
