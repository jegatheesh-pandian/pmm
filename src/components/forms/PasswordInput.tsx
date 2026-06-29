/**
 * PasswordInput - Password field with show/hide toggle and optional strength indicator
 * Ported from Angular PrimeNG p-password with strength bar
 */

import { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, HelperText, Text } from 'react-native-paper';
import { colors, spacing } from '@/theme';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { useController } from 'react-hook-form';

interface PasswordInputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  showStrength?: boolean;
  testID?: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
}

function calculateStrength(password: string): StrengthResult {
  if (!password) return { score: 0, label: '', color: 'transparent' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score: 1, label: 'Weak', color: colors.error };
  if (score <= 3) return { score: 2, label: 'Fair', color: colors.warning };
  if (score <= 4) return { score: 3, label: 'Good', color: colors.info };
  return { score: 4, label: 'Strong', color: colors.success };
}

const REQUIREMENTS = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'One special character' },
];

export function PasswordInput<T extends FieldValues>({
  control,
  name,
  label = 'Password',
  placeholder = 'Enter password',
  showStrength = false,
  testID,
}: PasswordInputProps<T>) {
  const {
    field: { onChange, onBlur, value },
    fieldState: { error },
  } = useController({ control, name });

  const [secureEntry, setSecureEntry] = useState(true);
  const strength = useMemo(() => calculateStrength(value ?? ''), [value]);

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        label={label}
        placeholder={placeholder}
        value={value ?? ''}
        onChangeText={onChange}
        onBlur={onBlur}
        secureTextEntry={secureEntry}
        autoComplete="password"
        textContentType="password"
        error={!!error}
        left={<TextInput.Icon icon="lock" />}
        right={
          <TextInput.Icon
            icon={secureEntry ? 'eye' : 'eye-off'}
            onPress={() => setSecureEntry((prev) => !prev)}
            accessibilityLabel={secureEntry ? 'Show password' : 'Hide password'}
          />
        }
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

      {showStrength && value && (
        <View style={styles.strengthContainer}>
          <View style={styles.barRow}>
            {[1, 2, 3, 4].map((level) => (
              <View
                key={level}
                style={[
                  styles.barSegment,
                  { backgroundColor: level <= strength.score ? strength.color : colors.neutral200 },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>

          <View style={styles.requirements}>
            {REQUIREMENTS.map((req) => {
              const met = req.test(value);
              return (
                <Text
                  key={req.label}
                  style={[styles.reqText, { color: met ? colors.success : colors.textTertiary }]}
                >
                  {met ? '\u2713' : '\u2022'} {req.label}
                </Text>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  strengthContainer: {
    marginTop: spacing[1],
    paddingHorizontal: spacing[0.5],
  },
  barRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  barSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  requirements: {
    gap: 2,
  },
  reqText: {
    fontSize: 12,
  },
});
