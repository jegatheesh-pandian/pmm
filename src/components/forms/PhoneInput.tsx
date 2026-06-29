/**
 * PhoneInput - Reusable phone number input
 * Auto-formats as (XXX) XXX-XXXX, strips non-digits for form value
 */

import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import { colors } from '@/theme';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { useController } from 'react-hook-form';

interface PhoneInputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  testID?: string;
}

function formatDisplayPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function PhoneInput<T extends FieldValues>({
  control,
  name,
  label = 'Phone Number',
  placeholder = '(555) 555-5555',
  testID,
}: PhoneInputProps<T>) {
  const {
    field: { onChange, onBlur, value },
    fieldState: { error },
  } = useController({ control, name });

  const [displayValue, setDisplayValue] = useState(() => formatDisplayPhone(value ?? ''));

  const handleChange = useCallback(
    (text: string) => {
      const digits = text.replace(/\D/g, '').slice(0, 10);
      setDisplayValue(formatDisplayPhone(digits));
      onChange(digits);
    },
    [onChange],
  );

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        label={label}
        placeholder={placeholder}
        value={displayValue}
        onChangeText={handleChange}
        onBlur={onBlur}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        error={!!error}
        left={<TextInput.Icon icon="phone" />}
        outlineColor={colors.border}
        activeOutlineColor={colors.primary}
        testID={testID}
        accessibilityLabel={label}
      />
      {error && (
        <HelperText type="error" visible>
          {error.message}
        </HelperText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
});
