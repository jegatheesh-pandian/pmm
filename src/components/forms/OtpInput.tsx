/**
 * OtpInput - 6-digit OTP input with auto-focus, paste, and backspace navigation
 * Ported from Angular register component's OTP digit boxes
 */

import { useRef, useCallback, useEffect } from 'react';
import { View, TextInput as RNTextInput, StyleSheet, Pressable, Keyboard } from 'react-native';
import { Text, HelperText } from 'react-native-paper';
import { colors, spacing, borderRadius, fontSize } from '@/theme';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoFocus?: boolean;
  testID?: string;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  error,
  autoFocus = true,
  testID,
}: OtpInputProps) {
  const inputRefs = useRef<(RNTextInput | null)[]>([]);
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [autoFocus]);

  const focusInput = useCallback(
    (index: number) => {
      const target = Math.max(0, Math.min(index, length - 1));
      inputRefs.current[target]?.focus();
    },
    [length],
  );

  const handleChange = useCallback(
    (text: string, index: number) => {
      // Handle paste (multiple characters)
      if (text.length > 1) {
        const pastedDigits = text.replace(/\D/g, '').slice(0, length);
        onChange(pastedDigits);
        const nextIndex = Math.min(pastedDigits.length, length - 1);
        focusInput(nextIndex);
        if (pastedDigits.length === length) Keyboard.dismiss();
        return;
      }

      const digit = text.replace(/\D/g, '');
      const newValue = digits.slice();
      newValue[index] = digit;
      const result = newValue.join('').slice(0, length);
      onChange(result);

      if (digit && index < length - 1) {
        focusInput(index + 1);
      }
      if (result.length === length) Keyboard.dismiss();
    },
    [digits, length, onChange, focusInput],
  );

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === 'Backspace') {
        if (!digits[index] && index > 0) {
          const newValue = digits.slice();
          newValue[index - 1] = '';
          onChange(newValue.join(''));
          focusInput(index - 1);
        } else {
          const newValue = digits.slice();
          newValue[index] = '';
          onChange(newValue.join(''));
        }
      }
    },
    [digits, onChange, focusInput],
  );

  return (
    <View style={styles.container} testID={testID} accessibilityLabel="Verification code input">
      <View style={styles.row}>
        {digits.map((digit, index) => (
          <Pressable key={index} onPress={() => focusInput(index)} style={styles.boxWrapper}>
            <RNTextInput
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.box,
                digit ? styles.boxFilled : null,
                error ? styles.boxError : null,
              ]}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? length : 1}
              selectTextOnFocus
              textContentType="oneTimeCode"
              autoComplete={index === 0 ? 'sms-otp' : 'off'}
              accessibilityLabel={`Digit ${index + 1} of ${length}`}
              accessibilityHint="Enter a single digit"
            />
          </Pressable>
        ))}
      </View>
      {error && (
        <HelperText type="error" visible style={styles.error}>
          {error}
        </HelperText>
      )}
    </View>
  );
}

const BOX_SIZE = 48;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: spacing[1],
    justifyContent: 'center',
  },
  boxWrapper: {
    width: BOX_SIZE,
    height: BOX_SIZE,
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    textAlign: 'center',
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  boxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  boxError: {
    borderColor: colors.error,
  },
  error: {
    textAlign: 'center',
  },
});
