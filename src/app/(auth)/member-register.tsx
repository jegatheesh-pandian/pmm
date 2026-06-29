/**
 * Member Registration Screen
 * Health plan member registration flow
 * Eligibility check -> Account creation -> OTP verification
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  HelperText,
  ProgressBar,
  Snackbar,
  ActivityIndicator,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useForm, useController } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { PhoneInput, PasswordInput, OtpInput } from '@/components/forms';
import apiClient from '@/services/api/apiClient';
import { ENDPOINTS } from '@/constants/api';
import { useAuthStore } from '@/store/authStore';
import { setSecureItem } from '@/utils/secureStorage';
import { SECURE_KEYS } from '@/constants/storage';
import { colors, spacing, fontSize, borderRadius } from '@/theme';
import type { StoredAuthData, BackendAuthResponse, ApiResponse } from '@/types/api';

const PHONE_REGEX = /^[+]?[0-9]{10,15}$/;
const OTP_COOLDOWN = 60;

type Step = 'eligibility' | 'account' | 'otp';

// ─── Schemas ─────────────────────────────────────────────────────────

const eligibilitySchema = yup.object({
  memberId: yup.string().required('Member ID is required'),
  dateOfBirth: yup.string().required('Date of birth is required'),
  lastName: yup.string().required('Last name is required'),
});

const accountSchema = yup.object({
  firstName: yup.string().required('First name is required').min(2, 'Minimum 2 characters'),
  mobile: yup
    .string()
    .required('Phone number is required')
    .matches(PHONE_REGEX, 'Enter a valid phone number'),
  email: yup.string().required('Email is required').email('Enter a valid email'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Minimum 8 characters')
    .matches(/[A-Z]/, 'Must contain an uppercase letter')
    .matches(/[a-z]/, 'Must contain a lowercase letter')
    .matches(/[0-9]/, 'Must contain a number')
    .matches(/[^A-Za-z0-9]/, 'Must contain a special character'),
  confirmPassword: yup
    .string()
    .required('Confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

type EligibilityData = yup.InferType<typeof eligibilitySchema>;
type AccountData = yup.InferType<typeof accountSchema>;

// ─── Component ───────────────────────────────────────────────────────

export default function MemberRegisterScreen() {
  const [step, setStep] = useState<Step>('eligibility');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eligibilityData, setEligibilityData] = useState<EligibilityData | null>(null);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval>>(null);

  const eligibilityForm = useForm<EligibilityData>({
    resolver: yupResolver(eligibilitySchema),
    defaultValues: { memberId: '', dateOfBirth: '', lastName: '' },
  });

  const accountForm = useForm<AccountData>({
    resolver: yupResolver(accountSchema),
    defaultValues: { firstName: '', mobile: '', email: '', password: '', confirmPassword: '' },
  });

  const startCooldown = useCallback(() => {
    setCooldown(OTP_COOLDOWN);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  // Date field for eligibility
  const DateField = ({ control, name }: { control: any; name: string }) => {
    const {
      field: { onChange, value },
      fieldState: { error: fieldError },
    } = useController({ control, name });

    const formatDateInput = (text: string) => {
      const digits = text.replace(/\D/g, '').slice(0, 8);
      if (digits.length <= 2) return digits;
      if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    };

    return (
      <View>
        <TextInput
          mode="outlined"
          label="Date of Birth"
          placeholder="MM/DD/YYYY"
          value={value}
          onChangeText={(text) => onChange(formatDateInput(text))}
          keyboardType="number-pad"
          error={!!fieldError}
          left={<TextInput.Icon icon="calendar" />}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
        />
        {fieldError && (
          <HelperText type="error" visible>
            {fieldError.message}
          </HelperText>
        )}
      </View>
    );
  };

  const handleEligibilityCheck = async (data: EligibilityData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.post<ApiResponse<{ eligible: boolean }>>(
        ENDPOINTS.MEMBER_REG_CHECK_ELIGIBILITY,
        data,
      );
      if (res.data.success && res.data.data?.eligible) {
        setEligibilityData(data);
        accountForm.setValue('firstName', '');
        setStep('account');
      } else {
        setError('We could not verify your eligibility. Please check your information.');
      }
    } catch {
      setError('Eligibility verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccountSubmit = async (data: AccountData) => {
    if (!eligibilityData) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.post<ApiResponse<{ registrationId: string }>>(
        ENDPOINTS.MEMBER_REG_REGISTER,
        {
          ...eligibilityData,
          firstName: data.firstName,
          mobile: data.mobile,
          emailId: data.email,
          password: data.password,
        },
      );
      if (res.data.success && res.data.data) {
        setRegistrationId(res.data.data.registrationId);
        setStep('otp');
        startCooldown();
      } else {
        setError(res.data.message ?? 'Registration failed.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6 || !registrationId) {
      setOtpError('Please enter the full 6-digit code.');
      return;
    }
    setIsSubmitting(true);
    setOtpError(null);
    try {
      const verifyRes = await apiClient.post<ApiResponse<{ verified: boolean }>>(
        ENDPOINTS.MEMBER_REG_VERIFY_OTP,
        { registrationId, otp: otpValue },
      );
      if (verifyRes.data.success && verifyRes.data.data?.verified) {
        // Complete registration
        const completeRes = await apiClient.post<ApiResponse<BackendAuthResponse>>(
          ENDPOINTS.MEMBER_REG_COMPLETE,
          { registrationId },
        );
        if (completeRes.data.success && completeRes.data.data) {
          const backend = completeRes.data.data;
          await setSecureItem<StoredAuthData>(SECURE_KEYS.AUTH_TOKENS, {
            token: backend.accessToken,
            refreshToken: backend.refreshToken,
            expiresAt: new Date(Date.now() + backend.expiresIn * 1000).toISOString(),
            refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            rememberMe: false,
          });
          const user = {
            id: backend.gbhUser.gbhUserId,
            email: backend.gbhUser.emailId,
            emailVerified: true,
            phone: backend.gbhUser.mobile,
            phoneVerified: true,
            firstName: backend.gbhUser.firstName,
            lastName: backend.gbhUser.lastName,
          };
          await setSecureItem(SECURE_KEYS.USER_DATA, user);
          useAuthStore.setState({
            user: {
              ...user,
              accountType: 'health_plan_member' as const,
              accountStatus: 'active' as const,
              accountTypeHistory: [],
              savedMedications: [],
              priceAlerts: [],
              couponHistory: [],
              familyMembers: [],
              notificationPreferences: {
                email: { priceAlerts: true, refillReminders: true, savingsTips: false, productUpdates: false },
                sms: { priceAlerts: false, refillReminders: false },
                push: { priceAlerts: true, refillReminders: true },
              },
              totalSavings: backend.gbhUser.totalSavings ?? 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            isAuthenticated: true,
          });
          router.replace('/(tabs)/account');
        }
      } else {
        setOtpError('Invalid verification code.');
      }
    } catch {
      setOtpError('Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || !registrationId) return;
    try {
      await apiClient.post(ENDPOINTS.MEMBER_REG_RESEND_OTP, { registrationId });
      startCooldown();
    } catch {
      setError('Failed to resend code.');
    }
  };

  const stepIndex = step === 'eligibility' ? 0 : step === 'account' ? 1 : 2;
  const STEPS = ['Eligibility', 'Account', 'Verify'];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={(stepIndex + 1) / STEPS.length}
            color={colors.primary}
            style={styles.progressBar}
          />
          <View style={styles.stepsRow}>
            {STEPS.map((label, i) => (
              <Text
                key={label}
                style={[styles.stepLabel, i <= stepIndex && styles.stepLabelActive]}
              >
                {label}
              </Text>
            ))}
          </View>
        </View>

        {/* Eligibility */}
        {step === 'eligibility' && (
          <View style={styles.content}>
            <Text variant="titleLarge" style={styles.title}>
              Verify Your Membership
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Enter your health plan member information to verify eligibility.
            </Text>

            <ControlledInput
              control={eligibilityForm.control}
              name="memberId"
              label="Member ID"
              icon="card-account-details"
            />
            <ControlledInput
              control={eligibilityForm.control}
              name="lastName"
              label="Last Name"
              autoCapitalize="words"
            />
            <DateField control={eligibilityForm.control} name="dateOfBirth" />

            <Button
              mode="contained"
              onPress={eligibilityForm.handleSubmit(handleEligibilityCheck)}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Verify Eligibility
            </Button>

            <Button mode="text" onPress={() => router.back()}>
              Back to Sign In
            </Button>
          </View>
        )}

        {/* Account */}
        {step === 'account' && (
          <View style={styles.content}>
            <Text variant="titleLarge" style={styles.title}>
              Create Your Account
            </Text>

            <ControlledInput
              control={accountForm.control}
              name="firstName"
              label="First Name"
              autoCapitalize="words"
            />

            <PhoneInput control={accountForm.control} name="mobile" />

            <ControlledInput
              control={accountForm.control}
              name="email"
              label="Email"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <PasswordInput
              control={accountForm.control}
              name="password"
              label="Password"
              showStrength
            />

            <PasswordInput
              control={accountForm.control}
              name="confirmPassword"
              label="Confirm Password"
            />

            <View style={styles.stepButtons}>
              <Button mode="outlined" onPress={() => setStep('eligibility')} style={styles.back}>
                Back
              </Button>
              <Button
                mode="contained"
                onPress={accountForm.handleSubmit(handleAccountSubmit)}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={styles.next}
                contentStyle={styles.buttonContent}
              >
                Continue
              </Button>
            </View>
          </View>
        )}

        {/* OTP */}
        {step === 'otp' && (
          <View style={styles.content}>
            <Text variant="titleLarge" style={styles.title}>
              Verify Your Phone
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Enter the 6-digit code sent to your phone.
            </Text>

            <View style={styles.otpCenter}>
              <OtpInput
                value={otpValue}
                onChange={(v) => {
                  setOtpValue(v);
                  setOtpError(null);
                }}
                error={otpError ?? undefined}
              />
              <Button
                mode="text"
                onPress={handleResendOtp}
                disabled={cooldown > 0}
                compact
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
              </Button>
            </View>

            <View style={styles.stepButtons}>
              <Button mode="outlined" onPress={() => setStep('account')} style={styles.back}>
                Back
              </Button>
              <Button
                mode="contained"
                onPress={handleVerifyOtp}
                loading={isSubmitting}
                disabled={isSubmitting || otpValue.length !== 6}
                style={styles.next}
                contentStyle={styles.buttonContent}
              >
                Complete Registration
              </Button>
            </View>
          </View>
        )}
      </ScrollView>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
        action={{ label: 'Dismiss', onPress: () => setError(null) }}
        style={styles.snackbar}
      >
        {error ?? ''}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

// ─── Controlled TextInput helper ─────────────────────────────────────

function ControlledInput({
  control,
  name,
  label,
  icon,
  keyboardType = 'default',
  autoCapitalize,
}: {
  control: any;
  name: string;
  label: string;
  icon?: string;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words';
}) {
  const {
    field: { onChange, onBlur, value },
    fieldState: { error },
  } = useController({ control, name });

  return (
    <View>
      <TextInput
        mode="outlined"
        label={label}
        value={value ?? ''}
        onChangeText={onChange}
        onBlur={onBlur}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        error={!!error}
        left={icon ? <TextInput.Icon icon={icon} /> : undefined}
        outlineColor={colors.border}
        activeOutlineColor={colors.primary}
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
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: spacing[3],
  },
  progressContainer: {
    marginBottom: spacing[3],
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[1],
  },
  stepLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    gap: spacing[2],
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: spacing[1],
  },
  button: {
    marginTop: spacing[2],
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: spacing[1],
  },
  stepButtons: {
    flexDirection: 'row',
    gap: spacing[1.5],
    marginTop: spacing[2],
  },
  back: {
    flex: 1,
    borderColor: colors.border,
  },
  next: {
    flex: 2,
  },
  otpCenter: {
    alignItems: 'center',
    marginVertical: spacing[3],
    gap: spacing[2],
  },
  snackbar: {
    backgroundColor: colors.error,
  },
});
