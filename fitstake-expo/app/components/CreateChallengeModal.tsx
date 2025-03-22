import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CreateChallengeModalProps } from '../../types/components';
import theme from '../theme';

const { colors, spacing, borderRadius, fontSize, fontWeight } = theme;

// Define maximum character limits
const MAX_TITLE_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 250;

const CreateChallengeModal = ({
  visible,
  onClose,
  onSubmit,
  isCreating,
  challenge,
  onChange,
}: CreateChallengeModalProps) => {
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date>(challenge.startDate);
  const [tempEndDate, setTempEndDate] = useState<Date>(challenge.endDate);

  // Update temp dates when challenge dates change
  useEffect(() => {
    setTempStartDate(challenge.startDate);
    setTempEndDate(challenge.endDate);
  }, [challenge.startDate, challenge.endDate]);

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // For Android, we show date and time pickers sequentially
  const showAndroidDatePicker = (isStartDate: boolean) => {
    if (isStartDate) {
      setShowStartDatePicker(true);
    } else {
      setShowEndDatePicker(true);
    }
  };

  const handleStartDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);

      if (selectedDate && event.type === 'set') {
        // Create a new date that combines the selected date with the current time
        const newDate = new Date(selectedDate);
        newDate.setHours(
          tempStartDate.getHours(),
          tempStartDate.getMinutes(),
          0,
          0
        );
        setTempStartDate(newDate);

        // Show the time picker next
        setTimeout(() => {
          setShowStartTimePicker(true);
        }, 100);
      }
    } else if (Platform.OS === 'ios') {
      // For iOS, just update the temp date
      if (selectedDate) {
        setTempStartDate(selectedDate);
      }
    }
  };

  const handleStartTimeChange = (
    event: DateTimePickerEvent,
    selectedTime?: Date
  ) => {
    setShowStartTimePicker(false);

    if (selectedTime && event.type === 'set') {
      // Create a new date that combines the current date with the selected time
      const newDate = new Date(tempStartDate);
      newDate.setHours(
        selectedTime.getHours(),
        selectedTime.getMinutes(),
        0,
        0
      );

      // Apply the final datetime
      onChange('startDate', newDate);

      // If end date is before new start date, adjust it
      if (challenge.endDate <= newDate) {
        const newEndDate = new Date(newDate);
        newEndDate.setHours(newEndDate.getHours() + 1);
        onChange('endDate', newEndDate);
      }
    }
  };

  const handleEndDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);

      if (selectedDate && event.type === 'set') {
        // Create a new date that combines the selected date with the current time
        const newDate = new Date(selectedDate);
        newDate.setHours(
          tempEndDate.getHours(),
          tempEndDate.getMinutes(),
          0,
          0
        );
        setTempEndDate(newDate);

        // Show the time picker next
        setTimeout(() => {
          setShowEndTimePicker(true);
        }, 100);
      }
    } else if (Platform.OS === 'ios') {
      // For iOS, just update the temp date
      if (selectedDate) {
        setTempEndDate(selectedDate);
      }
    }
  };

  const handleEndTimeChange = (
    event: DateTimePickerEvent,
    selectedTime?: Date
  ) => {
    setShowEndTimePicker(false);

    if (selectedTime && event.type === 'set') {
      // Create a new date that combines the current date with the selected time
      const newDate = new Date(tempEndDate);
      newDate.setHours(
        selectedTime.getHours(),
        selectedTime.getMinutes(),
        0,
        0
      );

      // Apply the final datetime
      onChange('endDate', newDate);
    }
  };

  const handleIOSStartDateConfirm = () => {
    setShowStartDatePicker(false);
    onChange('startDate', tempStartDate);

    // If end date is before new start date, adjust it
    if (challenge.endDate <= tempStartDate) {
      const newEndDate = new Date(tempStartDate);
      newEndDate.setDate(newEndDate.getDate() + 1);
      onChange('endDate', newEndDate);
    }
  };

  const handleIOSEndDateConfirm = () => {
    setShowEndDatePicker(false);
    onChange('endDate', tempEndDate);
  };

  const handleIOSDateCancel = (isStartDate: boolean) => {
    if (isStartDate) {
      setShowStartDatePicker(false);
      setTempStartDate(challenge.startDate); // Reset to original value
    } else {
      setShowEndDatePicker(false);
      setTempEndDate(challenge.endDate); // Reset to original value
    }
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
          <Text style={styles.modalTitle}>Create New Challenge</Text>

          <ScrollView style={styles.modalForm}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Challenge title"
                placeholderTextColor={colors.gray[500]}
                value={challenge.title}
                maxLength={MAX_TITLE_LENGTH}
                onChangeText={(text) => onChange('title', text)}
              />
              <Text style={styles.characterCount}>
                {challenge.title.length}/{MAX_TITLE_LENGTH}
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your challenge"
                placeholderTextColor={colors.gray[500]}
                multiline
                numberOfLines={4}
                maxLength={MAX_DESCRIPTION_LENGTH}
                value={challenge.description}
                onChangeText={(text) => onChange('description', text)}
              />
              <Text style={styles.characterCount}>
                {challenge.description.length}/{MAX_DESCRIPTION_LENGTH}
              </Text>
            </View>

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

            {/* Date selection fields */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Start Date & Time</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    setShowStartDatePicker(true);
                  } else {
                    // On Android, show the native picker directly
                    showAndroidDatePicker(true);
                  }
                }}
              >
                <Text style={styles.dateText}>
                  {formatDate(challenge.startDate)}
                </Text>
              </TouchableOpacity>
              <Text style={styles.datePickerNote}>
                Tap to select start date/time
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>End Date & Time</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    setShowEndDatePicker(true);
                  } else {
                    // On Android, show the native picker directly
                    showAndroidDatePicker(false);
                  }
                }}
              >
                <Text style={styles.dateText}>
                  {formatDate(challenge.endDate)}
                </Text>
              </TouchableOpacity>
              <Text style={styles.datePickerNote}>
                Tap to select end date/time
              </Text>
            </View>

            {/* Date Time Pickers - iOS only shows the picker in our UI */}
            {Platform.OS === 'ios' && showStartDatePicker && (
              <View style={styles.dateTimePickerContainer}>
                <View style={styles.dateTimePickerHeader}>
                  <TouchableOpacity onPress={() => handleIOSDateCancel(true)}>
                    <Text style={styles.dateTimePickerCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleIOSStartDateConfirm}>
                    <Text style={styles.dateTimePickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempStartDate}
                  mode="datetime"
                  display="spinner"
                  onChange={handleStartDateChange}
                  minimumDate={new Date()}
                  style={styles.dateTimePicker}
                />
              </View>
            )}

            {Platform.OS === 'ios' && showEndDatePicker && (
              <View style={styles.dateTimePickerContainer}>
                <View style={styles.dateTimePickerHeader}>
                  <TouchableOpacity onPress={() => handleIOSDateCancel(false)}>
                    <Text style={styles.dateTimePickerCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleIOSEndDateConfirm}>
                    <Text style={styles.dateTimePickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempEndDate}
                  mode="datetime"
                  display="spinner"
                  onChange={handleEndDateChange}
                  minimumDate={
                    new Date(tempStartDate.getTime() + 60 * 60 * 1000)
                  } // At least 1 hour after start
                  style={styles.dateTimePicker}
                />
              </View>
            )}

            {/* Android date and time pickers - shown natively and sequentially */}
            {Platform.OS === 'android' && showStartDatePicker && (
              <DateTimePicker
                value={tempStartDate}
                mode="date"
                onChange={handleStartDateChange}
                minimumDate={new Date()}
              />
            )}

            {Platform.OS === 'android' && showStartTimePicker && (
              <DateTimePicker
                value={tempStartDate}
                mode="time"
                onChange={handleStartTimeChange}
                is24Hour={true}
              />
            )}

            {Platform.OS === 'android' && showEndDatePicker && (
              <DateTimePicker
                value={tempEndDate}
                mode="date"
                onChange={handleEndDateChange}
                minimumDate={new Date(tempStartDate.getTime())}
              />
            )}

            {Platform.OS === 'android' && showEndTimePicker && (
              <DateTimePicker
                value={tempEndDate}
                mode="time"
                onChange={handleEndTimeChange}
                is24Hour={true}
              />
            )}

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
  inputContainer: {
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
    marginBottom: spacing.xs,
  },
  characterCount: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    textAlign: 'right',
    marginTop: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateInput: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: fontSize.md,
    color: colors.white,
  },
  datePickerNote: {
    fontSize: fontSize.xs,
    color: colors.accent.secondary,
    marginTop: 2,
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
  dateTimePickerContainer: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  dateTimePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  dateTimePickerCancel: {
    color: colors.gray[300],
    fontSize: fontSize.md,
  },
  dateTimePickerDone: {
    color: colors.accent.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  dateTimePicker: {
    height: 200,
  },
});

export default CreateChallengeModal;
