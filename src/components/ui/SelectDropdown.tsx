/**
 * SelectDropdown - Cross-platform dropdown that works on iOS and Android
 * - Android: Uses native Picker directly
 * - iOS: Shows touchable field that opens a modal with picker wheel
 */

import { useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, borderRadius, fontSize } from '@/theme';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectDropdownProps {
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
}

export function SelectDropdown({
  value,
  options,
  onValueChange,
  placeholder = 'Select...',
  accessibilityLabel,
}: SelectDropdownProps) {
  const { colors, brandColors } = useAppTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption?.label || placeholder;

  const handleConfirm = () => {
    onValueChange(tempValue);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setShowPicker(false);
  };

  // Android - use native picker directly
  if (Platform.OS === 'android') {
    return (
      <View style={[styles.pickerWrapper, { borderColor: brandColors.primary }]}>
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          style={[styles.androidPicker, { color: colors.onSurface }]}
          dropdownIconColor={colors.onSurfaceVariant}
          accessibilityLabel={accessibilityLabel}
        >
          {options.map((opt) => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
          ))}
        </Picker>
      </View>
    );
  }

  // iOS - touchable field that opens modal
  return (
    <>
      <TouchableOpacity
        style={[styles.iosButton, { borderColor: brandColors.primary }]}
        onPress={() => {
          setTempValue(value);
          setShowPicker(true);
        }}
        activeOpacity={0.7}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        <Text style={[styles.iosButtonText, { color: colors.onSurface }]}>
          {displayText}
        </Text>
        <Text style={[styles.iosChevron, { color: colors.onSurfaceVariant }]}>
          ▼
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleCancel}
          />
          <SafeAreaView style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.outlineVariant }]}>
              <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
                <Text style={[styles.headerButtonText, { color: colors.error }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirm} style={styles.headerButton}>
                <Text style={[styles.headerButtonText, { color: brandColors.primary }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={tempValue}
              onValueChange={setTempValue}
              style={styles.iosPicker}
              itemStyle={{ color: colors.onSurface }}
            >
              {options.map((opt) => (
                <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
              ))}
            </Picker>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Android styles
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  androidPicker: {
    height: 54,
  },

  // iOS button styles
  iosButton: {
    height: 54,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[2],
  },
  iosButtonText: {
    fontSize: fontSize.base,
    flex: 1,
  },
  iosChevron: {
    fontSize: 12,
    marginLeft: spacing[1],
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1.5],
    borderBottomWidth: 1,
  },
  headerButton: {
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[0.5],
  },
  headerButtonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  iosPicker: {
    height: 216,
  },
});
