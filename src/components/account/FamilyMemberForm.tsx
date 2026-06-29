/**
 * FamilyMemberForm - Add/Edit family member form using React Hook Form + Yup
 */

import { View, StyleSheet, Pressable } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, borderRadius, fontSize } from '@/theme';

const RELATIONSHIPS = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'parent', label: 'Parent' },
  { value: 'other', label: 'Other' },
] as const;

const AVATAR_COLORS = ['#0D7377', '#2E8540', '#7C3AED', '#DC2626', '#F59E0B', '#EC4899'];

const schema = yup.object({
  firstName: yup.string().required('First name is required').min(2, 'Minimum 2 characters'),
  lastName: yup.string().required('Last name is required').min(2, 'Minimum 2 characters'),
  relationship: yup
    .string()
    .oneOf(['spouse', 'child', 'parent', 'other'])
    .required('Relationship is required'),
  dateOfBirth: yup.string().optional(),
  avatarColor: yup.string().optional(),
});

export type FamilyMemberFormValues = yup.InferType<typeof schema>;

interface FamilyMemberFormProps {
  defaultValues?: Partial<FamilyMemberFormValues>;
  onSubmit: (values: FamilyMemberFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function FamilyMemberForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = 'Add Member',
}: FamilyMemberFormProps) {
  const { colors, brandColors } = useAppTheme();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FamilyMemberFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      relationship: 'child',
      dateOfBirth: '',
      avatarColor: AVATAR_COLORS[0],
      ...defaultValues,
    },
  });

  const selectedRelationship = watch('relationship');
  const selectedColor = watch('avatarColor');

  return (
    <View style={styles.container}>
      {/* First Name */}
      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              mode="outlined"
              label="First Name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.firstName}
              dense
              autoCapitalize="words"
            />
            {errors.firstName && (
              <HelperText type="error" visible>{errors.firstName.message}</HelperText>
            )}
          </>
        )}
      />

      {/* Last Name */}
      <Controller
        control={control}
        name="lastName"
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              mode="outlined"
              label="Last Name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.lastName}
              dense
              style={styles.field}
              autoCapitalize="words"
            />
            {errors.lastName && (
              <HelperText type="error" visible>{errors.lastName.message}</HelperText>
            )}
          </>
        )}
      />

      {/* Date of Birth (optional) */}
      <Controller
        control={control}
        name="dateOfBirth"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            mode="outlined"
            label="Date of Birth (optional)"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="MM/DD/YYYY"
            keyboardType="number-pad"
            dense
            style={styles.field}
          />
        )}
      />

      {/* Relationship */}
      <Text variant="bodySmall" style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>
        Relationship
      </Text>
      {errors.relationship && (
        <HelperText type="error" visible>{errors.relationship.message}</HelperText>
      )}
      <View style={styles.chipRow}>
        {RELATIONSHIPS.map((r) => (
          <Button
            key={r.value}
            mode={selectedRelationship === r.value ? 'contained' : 'outlined'}
            onPress={() => setValue('relationship', r.value, { shouldValidate: true })}
            compact
            style={styles.relButton}
            labelStyle={{ fontSize: 12 }}
          >
            {r.label}
          </Button>
        ))}
      </View>

      {/* Avatar Color */}
      <Text variant="bodySmall" style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>
        Avatar Color
      </Text>
      <View style={styles.colorRow}>
        {AVATAR_COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setValue('avatarColor', c)}
            style={[
              styles.colorCircle,
              { backgroundColor: c },
              selectedColor === c && styles.colorSelected,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Select color ${c}`}
          />
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button mode="text" onPress={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {submitLabel}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  field: {
    marginTop: spacing[1],
  },
  fieldLabel: {
    marginTop: spacing[2],
    marginBottom: spacing[0.5],
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1],
  },
  relButton: {
    borderRadius: borderRadius.md,
  },
  colorRow: {
    flexDirection: 'row',
    gap: spacing[1.5],
    marginTop: spacing[0.5],
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[1],
    marginTop: spacing[3],
  },
});
