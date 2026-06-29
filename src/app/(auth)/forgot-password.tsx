/**
 * Forgot Password Screen
 * Matches PriceMyMeds.com web design:
 * - Centered PriceMyMeds logo
 * - "Forgot Password?" title + subtitle
 * - White card: Phone Number field + "Send OTP" button
 * - "Remember your password? Sign in" footer
 * Preserves the 3-step flow: phone entry -> OTP + new password -> success
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
} from 'react-native';
import { Text, Button, Snackbar, Surface, Icon } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { PhoneInput, PasswordInput, OtpInput } from '@/components/forms';
import apiClient from '@/services/api/apiClient';
import { ENDPOINTS } from '@/constants/api';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

type ViewState = 'phone' | 'otp' | 'success';
const OTP_COOLDOWN = 60;

const phoneSchema = yup.object({
  mobile: yup
    .string()
    .required('Phone number is required')
    .matches(/^[+]?[0-9]{10,15}$/, 'Enter a valid phone number'),
});

const resetSchema = yup.object({
  newPassword: yup
    .string()
    .required('Password is required')
    .min(8, 'Minimum 8 characters')
    .matches(/[A-Z]/, 'Must contain an uppercase letter')
    .matches(/[a-z]/, 'Must contain a lowercase letter')
    .matches(/[0-9]/, 'Must contain a number'),
  confirmPassword: yup
    .string()
    .required('Confirm your password')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

type PhoneFormData = yup.InferType<typeof phoneSchema>;
type ResetFormData = yup.InferType<typeof resetSchema>;

const HEADINGS: Record<ViewState, { title: string; subtitle: string }> = {
  phone: {
    title: 'Forgot Password?',
    subtitle: "Enter your registered phone number and we'll send you an OTP to reset your password",
  },
  otp: {
    title: 'Reset Password',
    subtitle: 'Enter the code we sent you and create a new password',
  },
  success: {
    title: 'Password Reset!',
    subtitle: 'Your password has been successfully reset',
  },
};

export default function ForgotPasswordScreen() {
  const [viewState, setViewState] = useState<ViewState>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval>>(null);

  const phoneForm = useForm<PhoneFormData>({
    resolver: yupResolver(phoneSchema),
    defaultValues: { mobile: '' },
  });

  const resetForm = useForm<ResetFormData>({
    resolver: yupResolver(resetSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
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

  const handlePhoneSubmit = async (data: PhoneFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.post(`${ENDPOINTS.AUTH_FORGOT_PASSWORD}/request`, {
        mobile: data.mobile,
      });
      setPhoneNumber(data.mobile);
      setMaskedPhone(`***-***-${data.mobile.slice(-4)}`);
      setViewState('otp');
      startCooldown();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (data: ResetFormData) => {
    if (otpValue.length !== 6) {
      setOtpError('Please enter the full 6-digit code.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setOtpError(null);
    try {
      const res = await apiClient.post(`${ENDPOINTS.AUTH_FORGOT_PASSWORD}/reset`, {
        mobile: phoneNumber,
        otp: otpValue,
        newPassword: data.newPassword,
      });
      if (res.data.success) {
        setViewState('success');
      } else {
        setError(res.data.message ?? 'Failed to reset password.');
      }
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as any).response?.status === 400
      ) {
        setOtpError('Invalid verification code.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to reset password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    try {
      await apiClient.post(`${ENDPOINTS.AUTH_FORGOT_PASSWORD}/request`, {
        mobile: phoneNumber,
      });
      startCooldown();
    } catch {
      setError('Failed to resend code.');
    }
  };

  const heading = HEADINGS[viewState];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#F0FDF9', '#FFFFFF', '#F0FDF9']} style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo + Heading */}
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="PriceMyMeds"
          />

          {viewState === 'success' && (
            <View style={styles.successIconCircle}>
              <Icon source="check" size={36} color="#FFFFFF" />
            </View>
          )}

          <Text style={styles.title}>{heading.title}</Text>
          <Text style={styles.subtitle}>
            {viewState === 'otp' ? `${heading.subtitle} (sent to ${maskedPhone})` : heading.subtitle}
          </Text>

          {/* Form Card */}
          <Surface style={styles.card} elevation={1}>
            {/* Phone Entry */}
            {viewState === 'phone' && (
              <>
                <PhoneInput
                  control={phoneForm.control}
                  name="mobile"
                  placeholder="Enter your registered phone number"
                />
                <Button
                  mode="contained"
                  onPress={phoneForm.handleSubmit(handlePhoneSubmit)}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                >
                  Send OTP
                </Button>
              </>
            )}

            {/* OTP + New Password */}
            {viewState === 'otp' && (
              <>
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
                  style={styles.resendButton}
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
                </Button>

                <PasswordInput
                  control={resetForm.control}
                  name="newPassword"
                  label="New Password"
                  showStrength
                />

                <PasswordInput
                  control={resetForm.control}
                  name="confirmPassword"
                  label="Confirm New Password"
                />

                <Button
                  mode="contained"
                  onPress={resetForm.handleSubmit(handleResetSubmit)}
                  loading={isSubmitting}
                  disabled={isSubmitting || otpValue.length !== 6}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                >
                  Reset Password
                </Button>

                <Button
                  mode="text"
                  onPress={() => setViewState('phone')}
                  style={styles.backLink}
                >
                  Use a different phone number
                </Button>
              </>
            )}

            {/* Success */}
            {viewState === 'success' && (
              <Button
                mode="contained"
                onPress={() => router.replace('/(auth)/login')}
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Sign In
              </Button>
            )}
          </Surface>

          {/* Footer: back to sign in */}
          {viewState !== 'success' && (
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Remember your password? </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable hitSlop={8}>
                  <Text style={styles.footerLink}>Sign in</Text>
                </Pressable>
              </Link>
            </View>
          )}
        </ScrollView>
      </LinearGradient>

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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[6],
  },
  logo: {
    width: 220,
    height: 52,
    marginBottom: spacing[2],
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[1],
    marginBottom: spacing[2],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing[1],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing[3],
    paddingHorizontal: spacing[2],
    lineHeight: 22,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    gap: spacing[1.5],
  },
  button: {
    marginTop: spacing[1],
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  buttonContent: {
    paddingVertical: spacing[1],
  },
  buttonLabel: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backLink: {
    marginTop: spacing[0.5],
  },
  resendButton: {
    alignSelf: 'center',
    marginVertical: spacing[0.5],
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[3],
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '700',
  },
  snackbar: {
    backgroundColor: colors.error,
  },
});
