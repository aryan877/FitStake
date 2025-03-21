import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import theme from '../theme';

const { colors, spacing, borderRadius, fontSize, fontWeight } = theme;

interface CreateChallengeModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isCreating: boolean;
  challenge: {
    title: string;
    description: string;
    stakeAmount: string;
    goalSteps: string;
    durationDays: string;
    minParticipants: string;
    maxParticipants: string;
  };
  onChange: (field: string, value: string) => void;
}

const CreateChallengeModal = ({
  visible,
  onClose,
  onSubmit,
  isCreating,
  challenge,
  onChange,
}: CreateChallengeModalProps) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create New Challenge</Text>

          <ScrollView style={styles.modalForm}>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Challenge title"
              placeholderTextColor={colors.gray[500]}
              value={challenge.title}
              onChangeText={(text) => onChange('title', text)}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your challenge"
              placeholderTextColor={colors.gray[500]}
              multiline
              numberOfLines={4}
              value={challenge.description}
              onChangeText={(text) => onChange('description', text)}
            />

            <Text style={styles.inputLabel}>Stake Amount (SOL)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.1"
              placeholderTextColor={colors.gray[500]}
              keyboardType="decimal-pad"
              value={challenge.stakeAmount}
              onChangeText={(text) => {
                // Allow valid decimal input
                if (text === '' || /^\d*\.?\d*$/.test(text)) {
                  onChange('stakeAmount', text);
                }
              }}
            />

            <Text style={styles.inputLabel}>Step Goal</Text>
            <TextInput
              style={styles.input}
              placeholder="10000"
              placeholderTextColor={colors.gray[500]}
              keyboardType="number-pad"
              value={challenge.goalSteps}
              onChangeText={(text) => {
                // Allow only numeric input
                if (text === '' || /^\d*$/.test(text)) {
                  onChange('goalSteps', text);
                }
              }}
            />

            <Text style={styles.inputLabel}>Duration (days)</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              placeholderTextColor={colors.gray[500]}
              keyboardType="number-pad"
              value={challenge.durationDays}
              onChangeText={(text) => {
                // Allow only numeric input
                if (text === '' || /^\d*$/.test(text)) {
                  onChange('durationDays', text);
                }
              }}
            />

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Min Participants</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2"
                  placeholderTextColor={colors.gray[500]}
                  keyboardType="number-pad"
                  value={challenge.minParticipants}
                  onChangeText={(text) => {
                    // Allow only numeric input
                    if (text === '' || /^\d*$/.test(text)) {
                      onChange('minParticipants', text);
                    }
                  }}
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Max Participants</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10"
                  placeholderTextColor={colors.gray[500]}
                  keyboardType="number-pad"
                  value={challenge.maxParticipants}
                  onChangeText={(text) => {
                    // Allow only numeric input
                    if (text === '' || /^\d*$/.test(text)) {
                      onChange('maxParticipants', text);
                    }
                  }}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, isCreating && styles.disabledButton]}
              onPress={onSubmit}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.actionButtonText}>Create</Text>
              )}
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
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
  disabledButton: {
    opacity: 0.6,
  },
});

export default CreateChallengeModal;
