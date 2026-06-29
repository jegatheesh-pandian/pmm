/**
 * Register Screen - 3-Step Registration Wizard
 * Matches PriceMyMeds.com signup flow:
 *
 * Step 1: Account (First Name, Last Name, Mobile, Email, DOB, Password, Confirm Password)
 * Step 2: Insurance (Proceed with Insurance ID / I do not have insurance, Terms checkbox)
 * Step 3: Confirm (OTP verify mobile, then OTP verify email)
 *
 * - Branded header with logo, title, subtitle
 * - Numbered circle stepper: 1 Account — 2 Insurance — 3 Confirm
 * - Card-based form sections
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  HelperText,
  Checkbox,
  Snackbar,
  Icon,
  Surface,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm, useController } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { PhoneInput, PasswordInput, OtpInput } from '@/components/forms';
import { registrationApi } from '@/services/api/registrationApi';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

// ─── Validation Schemas ──────────────────────────────────────────────

const PHONE_REGEX = /^[+]?[0-9]{10,15}$/;

const step1Schema = yup.object({
  firstName: yup.string().required('First name is required').min(2, 'Minimum 2 characters'),
  lastName: yup.string().required('Last name is required').min(2, 'Minimum 2 characters'),
  mobile: yup
    .string()
    .required('Phone number is required')
    .matches(PHONE_REGEX, 'Enter a valid phone number'),
  email: yup.string().required('Email is required').email('Enter a valid email'),
  dateOfBirth: yup.string().required('Date of birth is required'),
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

type Step1Data = yup.InferType<typeof step1Schema>;

// ─── Constants ───────────────────────────────────────────────────────

const STEP_LABELS = ['Account', 'Insurance', 'Confirm'];
const OTP_COOLDOWN = 60;

// ─── Stepper Component ──────────────────────────────────────────────

function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <View style={styles.stepper}>
      {STEP_LABELS.map((label, i) => {
        const isCompleted = i < currentStep;
        const isActive = i === currentStep;
        const isLast = i === STEP_LABELS.length - 1;

        return (
          <View key={label} style={styles.stepperItem}>
            <View style={styles.stepperCircleRow}>
              <View
                style={[
                  styles.stepperCircle,
                  isCompleted && styles.stepperCircleCompleted,
                  isActive && styles.stepperCircleActive,
                  !isCompleted && !isActive && styles.stepperCircleInactive,
                ]}
              >
                {isCompleted ? (
                  <Icon source="check" size={18} color="#FFFFFF" />
                ) : (
                  <Text style={[
                    styles.stepperNumber,
                    (isActive || isCompleted) && styles.stepperNumberActive,
                  ]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.stepperLine,
                    i < currentStep && styles.stepperLineCompleted,
                  ]}
                />
              )}
            </View>
            <Text
              style={[
                styles.stepperLabel,
                (isActive || isCompleted) && styles.stepperLabelActive,
              ]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 2 state
  const [insuranceOption, setInsuranceOption] = useState<'insurance' | 'none'>('insurance');
  const [insuranceId, setInsuranceId] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Step 3 (OTP) state
  const [otpPhase, setOtpPhase] = useState<'mobile' | 'email'>('mobile');
  const [mobileVerified, setMobileVerified] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval>>(null);

  // Debounced uniqueness check state
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [mobileAvailable, setMobileAvailable] = useState<boolean | null>(null);
  const emailTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const mobileTimerRef = useRef<ReturnType<typeof setTimeout>>(null);


  // ─── Step 1 Form ────────────────────────────────────────────────

  const step1Form = useForm<Step1Data>({
    resolver: yupResolver(step1Schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      mobile: '',
      email: '',
      dateOfBirth: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Debounced email uniqueness check
  const watchEmail = step1Form.watch('email');
  useEffect(() => {
    if (emailTimerRef.current) clearTimeout(emailTimerRef.current);
    setEmailAvailable(null);
    if (!watchEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchEmail)) return;
    emailTimerRef.current = setTimeout(async () => {
      try {
        const res = await registrationApi.checkEmail(watchEmail);
        const data = res.data?.data ?? res.data;
        // API may return { available } or { exists }
        if (data.available !== undefined) {
          setEmailAvailable(data.available);
        } else if (data.exists !== undefined) {
          setEmailAvailable(!data.exists);
        } else {
          setEmailAvailable(null);
        }
      } catch {
        setEmailAvailable(null);
      }
    }, 500);
    return () => {
      if (emailTimerRef.current) clearTimeout(emailTimerRef.current);
    };
  }, [watchEmail]);

  // Debounced mobile uniqueness check
  const watchMobile = step1Form.watch('mobile');
  useEffect(() => {
    if (mobileTimerRef.current) clearTimeout(mobileTimerRef.current);
    setMobileAvailable(null);
    if (!watchMobile || watchMobile.replace(/\D/g, '').length < 10) return;
    mobileTimerRef.current = setTimeout(async () => {
      try {
        const res = await registrationApi.checkMobile(watchMobile);
        const data = res.data?.data ?? res.data;
        if (data.available !== undefined) {
          setMobileAvailable(data.available);
        } else if (data.exists !== undefined) {
          setMobileAvailable(!data.exists);
        } else {
          setMobileAvailable(null);
        }
      } catch {
        setMobileAvailable(null);
      }
    }, 500);
    return () => {
      if (mobileTimerRef.current) clearTimeout(mobileTimerRef.current);
    };
  }, [watchMobile]);

  // ─── Cooldown Timer ─────────────────────────────────────────────

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

  // After successful completion, show the success message briefly then go to login
  useEffect(() => {
    if (!completed) return;
    const t = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 2000);
    return () => clearTimeout(t);
  }, [completed]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Step Handlers ──────────────────────────────────────────────

  const handleStep1Submit = async (data: Step1Data) => {
    if (emailAvailable === false) {
      setError('This email is already registered.');
      return;
    }
    if (mobileAvailable === false) {
      setError('This phone number is already registered.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      // Convert MM/DD/YYYY display format to YYYY-MM-DD (ISO) for backend
      let isoDob = data.dateOfBirth;
      const dobParts = data.dateOfBirth.split('/');
      if (dobParts.length === 3) {
        const [mm, dd, yyyy] = dobParts;
        isoDob = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
      }

      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        mobile: data.mobile,
        email: data.email,
        dateOfBirth: isoDob,
        password: data.password,
        confirmPassword: data.confirmPassword,
      };
      console.log('[Register] Step1 payload:', JSON.stringify(payload));
      const res = await registrationApi.submitStep1(payload);
      console.log('[Register] Step1 response:', JSON.stringify(res.data));
      const resp = res.data?.data ?? res.data;
      if (resp.success && resp.registrationId) {
        setRegistrationId(resp.registrationId);
        setCurrentStep(1);
      } else {
        setError(resp.message ?? 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.log('[Register] Step1 error:', err?.response?.status, JSON.stringify(err?.response?.data));
      const msg = err?.response?.data?.message || err?.message || 'Registration failed.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep2Submit = async () => {
    if (!acceptedTerms) {
      setError('Please accept the terms and conditions.');
      return;
    }
    if (!registrationId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await registrationApi.submitStep2({
        registrationId,
        hasInsurance: insuranceOption === 'insurance',
        insuranceId: insuranceOption === 'insurance' ? insuranceId : undefined,
      });
      console.log('[Register] Step2 response:', JSON.stringify(res.data));
      const resp = (res.data as any)?.data ?? res.data;
      if (resp.success) {
        // Backend already generates AND sends both the mobile and email OTPs
        // as part of step 2 (see GeneralRegistrationServiceImpl.submitStep2).
        // Do NOT resend here — regenerating an OTP after its email/SMS has
        // already been delivered makes the code the user received stale.
        setCurrentStep(2);
        setOtpPhase('mobile');
        startCooldown();
      } else {
        setError(resp.message ?? 'Failed to save insurance info.');
      }
    } catch (err: any) {
      console.log('[Register] Step2 error:', err?.response?.status, JSON.stringify(err?.response?.data));
      setError(err?.response?.data?.message || err?.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      setOtpError('Please enter the full 6-digit code.');
      return;
    }
    if (!registrationId) return;

    setIsSubmitting(true);
    setOtpError(null);
    try {
      const code = otpValue.trim();
      console.log('[Register] VerifyOtp request:', JSON.stringify({ registrationId, type: otpPhase, code }));
      const res = await registrationApi.verifyOtp({
        registrationId,
        type: otpPhase,
        code,
      });
      console.log('[Register] VerifyOtp response:', JSON.stringify(res.data));
      const resp = res.data?.data ?? res.data;
      if (resp.success) {
        if (otpPhase === 'mobile') {
          setMobileVerified(true);
          setOtpPhase('email');
          setOtpValue('');
          // Backend already generated the email OTP during step 2 — do NOT
          // regenerate it here, or the code the user received becomes stale.
          startCooldown();
        } else {
          await handleRegistrationComplete();
        }
      } else {
        setOtpError(resp.message ?? 'Invalid verification code. Please try again.');
      }
    } catch (err: any) {
      console.log('[Register] VerifyOtp error:', err?.response?.status, JSON.stringify(err?.response?.data));
      setOtpError(err?.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || !registrationId) return;
    try {
      await registrationApi.resendOtp(registrationId, otpPhase);
      startCooldown();
    } catch {
      setError('Failed to resend code.');
    }
  };

  const handleRegistrationComplete = async () => {
    if (!registrationId) return;
    setIsSubmitting(true);
    try {
      const res = await registrationApi.complete(registrationId);
      // The general-registration endpoints return a FLAT body (no { data } envelope).
      const body: any = (res.data as any)?.data ?? res.data;
      console.log('[Register] Complete response:', JSON.stringify(res.data));

      if (!body?.success) {
        setError(body?.message ?? 'Failed to complete registration. Please try again.');
        return;
      }

      // Account created — show success and route the user to the login page
      // (we intentionally do not auto-sign-in; the user signs in afterwards).
      setCompleted(true);
    } catch (err: any) {
      console.log('[Register] Complete error:', err?.response?.status, JSON.stringify(err?.response?.data));
      setError(err?.response?.data?.message || 'Failed to complete registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Mask helpers ─────────────────────────────────────────────────

  const maskedPhone = () => {
    const phone = step1Form.getValues('mobile');
    if (!phone || phone.length < 4) return phone;
    return '*'.repeat(phone.length - 2) + phone.slice(-2);
  };

  const maskedEmail = () => {
    const email = step1Form.getValues('email');
    if (!email) return email;
    const [local, domain] = email.split('@');
    if (!domain) return email;
    return local[0] + '*'.repeat(Math.max(local.length - 2, 1)) + local.slice(-1) + '@' + domain;
  };

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.flex, { backgroundColor: '#F0FDF9' }]}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: spacing[4] + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={['#F0FDF9', '#E6F7F4']}
          style={[styles.header, { paddingTop: insets.top + spacing[1] }]}
        >
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={styles.homeBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back to home"
          >
            <Icon source="arrow-left" size={22} color="#0D7377" />
            <Text style={styles.homeBtnText}>Home</Text>
          </Pressable>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Create Your Account</Text>
          <Text style={styles.headerSubtitle}>
            Start saving up to 80% on your prescriptions
          </Text>
          <Stepper currentStep={currentStep} />
        </LinearGradient>

        {/* Step 1: Account Information */}
        {currentStep === 0 && (
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.cardTitle}>Account Information</Text>

            <Text style={styles.fieldLabel}>
              First Name <Text style={styles.required}>*</Text>
            </Text>
            <ControlledTextInput
              control={step1Form.control}
              name="firstName"
              placeholder="John"
              autoComplete="given-name"
              textContentType="givenName"
            />

            <Text style={styles.fieldLabel}>
              Last Name <Text style={styles.required}>*</Text>
            </Text>
            <ControlledTextInput
              control={step1Form.control}
              name="lastName"
              placeholder="Smith"
              autoComplete="family-name"
              textContentType="familyName"
            />

            <Text style={styles.fieldLabel}>
              Mobile Number <Text style={styles.required}>*</Text>
            </Text>
            <PhoneInput control={step1Form.control} name="mobile" />
            {mobileAvailable === false && (
              <HelperText type="error" visible>
                This phone number is already registered.
              </HelperText>
            )}

            <Text style={styles.fieldLabel}>
              Email Address <Text style={styles.required}>*</Text>
            </Text>
            <ControlledTextInput
              control={step1Form.control}
              name="email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              autoCapitalize="none"
              icon="email-outline"
            />
            {emailAvailable === false && (
              <HelperText type="error" visible>
                This email is already registered.
              </HelperText>
            )}

            <DateOfBirthField control={step1Form.control} />

            <Text style={styles.fieldLabel}>
              Password <Text style={styles.required}>*</Text>
            </Text>
            <PasswordInput
              control={step1Form.control}
              name="password"
              label="Create a strong password"
              showStrength
            />

            <Text style={styles.fieldLabel}>
              Confirm Password <Text style={styles.required}>*</Text>
            </Text>
            <PasswordInput
              control={step1Form.control}
              name="confirmPassword"
              label="Confirm your password"
            />

            <Button
              mode="contained"
              onPress={step1Form.handleSubmit(handleStep1Submit)}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.primaryButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Continue to Insurance
            </Button>
          </Surface>
        )}

        {/* Step 2: Insurance Information */}
        {currentStep === 1 && (
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.cardTitle}>Insurance Information</Text>
            <Text style={styles.cardSubtitle}>
              Select how you'd like to proceed with your registration.
            </Text>

            {/* Insurance Option Cards */}
            <Pressable
              onPress={() => setInsuranceOption('insurance')}
              style={[
                styles.optionCard,
                insuranceOption === 'insurance' && styles.optionCardSelected,
              ]}
            >
              <View style={[
                styles.radioOuter,
                insuranceOption === 'insurance' && styles.radioOuterSelected,
              ]}>
                {insuranceOption === 'insurance' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Proceed with Insurance ID</Text>
                <Text style={styles.optionDesc}>Verify your insurance for additional benefits</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setInsuranceOption('none')}
              style={[
                styles.optionCard,
                insuranceOption === 'none' && styles.optionCardSelected,
              ]}
            >
              <View style={[
                styles.radioOuter,
                insuranceOption === 'none' && styles.radioOuterSelected,
              ]}>
                {insuranceOption === 'none' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>I do not have insurance</Text>
                <Text style={styles.optionDesc}>Continue without insurance verification</Text>
              </View>
            </Pressable>

            {insuranceOption === 'insurance' && (
              <View style={styles.insuranceField}>
                <Text style={styles.fieldLabel}>
                  Insurance ID <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  mode="outlined"
                  placeholder="Enter your insurance ID"
                  value={insuranceId}
                  onChangeText={setInsuranceId}
                  left={<TextInput.Icon icon="card-account-details-outline" />}
                  outlineStyle={styles.inputOutline}
                />
              </View>
            )}

            <Pressable
              style={styles.termsRow}
              onPress={() => setAcceptedTerms((prev) => !prev)}
            >
              <Checkbox.Android
                status={acceptedTerms ? 'checked' : 'unchecked'}
                color="#0D7377"
              />
              <Text style={styles.termsText}>
                By signing up, you agree to our{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text> and{' '}
                <Text style={styles.termsLink}>Terms of Use</Text>.
              </Text>
            </Pressable>

            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={() => setCurrentStep(0)}
                style={styles.backButton}
                labelStyle={styles.backButtonLabel}
              >
                Back
              </Button>
              <Button
                mode="contained"
                onPress={handleStep2Submit}
                loading={isSubmitting}
                disabled={isSubmitting || !acceptedTerms}
                style={styles.continueButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Continue
              </Button>
            </View>
          </Surface>
        )}

        {/* Success: account created */}
        {completed && (
          <Surface style={styles.card} elevation={1}>
            <View style={styles.completeContent}>
              <View style={styles.completeIconCircle}>
                <Icon source="check" size={36} color="#FFFFFF" />
              </View>
              <Text style={styles.completeTitle}>Account Created!</Text>
              <Text style={styles.completeText}>
                Your account has been created successfully. Redirecting you to sign in…
              </Text>
              <Button
                mode="contained"
                onPress={() => router.replace('/(auth)/login')}
                style={styles.verifyButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Go to Sign In
              </Button>
            </View>
          </Surface>
        )}

        {/* Step 3: Verify Account */}
        {currentStep === 2 && !completed && (
          <Surface style={styles.card} elevation={1}>
            {mobileVerified && (
              <View style={styles.successBanner}>
                <Icon source="check-circle-outline" size={18} color="#166534" />
                <Text style={styles.successBannerText}>Mobile verified successfully!</Text>
              </View>
            )}

            <Text style={styles.cardTitle}>Verify Your Account</Text>

            <Text style={styles.otpDescription}>
              Enter the 6-digit code sent to{' '}
              <Text style={{ fontWeight: '700' }}>
                {otpPhase === 'mobile' ? maskedPhone() : maskedEmail()}
              </Text>
            </Text>

            <View style={styles.otpContainer}>
              <OtpInput
                value={otpValue}
                onChange={(v) => {
                  setOtpValue(v);
                  setOtpError(null);
                }}
                error={otpError ?? undefined}
              />
            </View>

            <Button
              mode="contained"
              onPress={handleVerifyOtp}
              loading={isSubmitting}
              disabled={isSubmitting || otpValue.length !== 6}
              style={styles.verifyButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              {otpPhase === 'mobile' ? 'Verify Mobile' : 'Verify Email'}
            </Button>

            <Button
              mode="text"
              onPress={handleResendOtp}
              disabled={cooldown > 0}
              style={styles.resendButton}
              labelStyle={{ color: '#0D7377' }}
            >
              Resend Code
            </Button>

            {cooldown > 0 && (
              <Text style={styles.cooldownText}>
                Code expires in {formatTimer(cooldown)}
              </Text>
            )}
          </Surface>
        )}

        {/* Sign In Link */}
        <View style={styles.signInRow}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.signInLink}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
        action={{ label: 'Dismiss', onPress: () => setError(null) }}
        style={{ backgroundColor: '#DC2626' }}
      >
        {error ?? ''}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

// ─── Generic Controlled TextInput ────────────────────────────────────

interface ControlledTextInputProps {
  control: any;
  name: string;
  placeholder?: string;
  label?: string;
  keyboardType?: 'default' | 'email-address' | 'number-pad';
  autoComplete?: string;
  textContentType?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  icon?: string;
}

function ControlledTextInput({
  control,
  name,
  placeholder,
  label,
  keyboardType = 'default',
  autoComplete,
  textContentType,
  autoCapitalize,
  icon,
}: ControlledTextInputProps) {
  const {
    field: { onChange, onBlur, value },
    fieldState: { error },
  } = useController({ control, name });

  return (
    <View>
      <TextInput
        mode="outlined"
        label={label}
        placeholder={placeholder}
        value={value ?? ''}
        onChangeText={onChange}
        onBlur={onBlur}
        keyboardType={keyboardType}
        autoComplete={autoComplete as any}
        textContentType={textContentType as any}
        autoCapitalize={autoCapitalize}
        error={!!error}
        left={icon ? <TextInput.Icon icon={icon} /> : undefined}
        outlineStyle={styles.inputOutline}
      />
      {error && (
        <HelperText type="error" visible>{error.message}</HelperText>
      )}
    </View>
  );
}

// ─── Date of Birth Field (native date picker) ───────────────────────

// DOB is stored as an MM/DD/YYYY string to match the step-1 validation and
// submit handler (which splits on "/" to build the ISO date for the backend).
function formatDob(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${date.getFullYear()}`;
}

function parseDob(value?: string): Date | null {
  if (!value) return null;
  const [mm, dd, yyyy] = value.split('/');
  if (mm && dd && yyyy && yyyy.length === 4) {
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function DateOfBirthField({ control }: { control: any }) {
  const {
    field: { onChange, value },
    fieldState: { error: fieldError },
  } = useController({ control, name: 'dateOfBirth' });
  const [showPicker, setShowPicker] = useState(false);

  // Sensible default the spinner opens on when no date is chosen yet.
  const pickerValue = parseDob(value) ?? new Date(2000, 0, 1);

  const handleChange = (event: { type: string }, selected?: Date) => {
    // Android fires once and we must hide the dialog ourselves; iOS keeps it open.
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'set' && selected) {
      onChange(formatDob(selected));
    }
  };

  return (
    <View>
      <Text style={styles.fieldLabel}>
        Date of Birth <Text style={styles.required}>*</Text>
      </Text>
      <Pressable onPress={() => setShowPicker(true)} accessibilityRole="button">
        <View pointerEvents="none">
          <TextInput
            mode="outlined"
            placeholder="MM/DD/YYYY"
            value={value}
            editable={false}
            error={!!fieldError}
            left={<TextInput.Icon icon="calendar" />}
            outlineStyle={styles.inputOutline}
          />
        </View>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={handleChange}
        />
      )}
      {Platform.OS === 'ios' && showPicker && (
        <Button mode="text" onPress={() => setShowPicker(false)} labelStyle={{ color: '#0D7377' }}>
          Done
        </Button>
      )}
      {fieldError && (
        <HelperText type="error" visible>{fieldError.message}</HelperText>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing[4],
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    paddingHorizontal: spacing[3],
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: spacing[0.5],
    marginBottom: spacing[1],
  },
  homeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D7377',
    marginLeft: 4,
  },
  logo: {
    height: 36,
    width: 180,
    marginBottom: spacing[2],
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing[3],
  },

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
  },
  stepperItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepperCircleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  stepperCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  stepperCircleActive: {
    backgroundColor: '#0D7377',
  },
  stepperCircleCompleted: {
    backgroundColor: '#2E8540',
  },
  stepperCircleInactive: {
    backgroundColor: '#E5E7EB',
  },
  stepperNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  stepperNumberActive: {
    color: '#FFFFFF',
  },
  stepperLine: {
    position: 'absolute',
    right: 0,
    width: '50%',
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  stepperLineCompleted: {
    backgroundColor: '#2E8540',
  },
  stepperLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    fontWeight: '500',
  },
  stepperLabelActive: {
    color: '#0D7377',
    fontWeight: '700',
  },

  // Card
  card: {
    marginHorizontal: spacing[2],
    marginTop: spacing[2],
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: spacing[1],
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: spacing[2],
  },

  // Fields
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: spacing[1.5],
    marginBottom: 4,
  },
  required: {
    color: '#DC2626',
  },
  inputOutline: {
    borderRadius: 8,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing[1.5],
  },
  nameField: {
    flex: 1,
  },

  // Buttons
  primaryButton: {
    marginTop: spacing[3],
    borderRadius: 8,
    backgroundColor: '#0D7377',
  },
  buttonContent: {
    paddingVertical: 6,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  backButton: {
    borderRadius: 8,
    borderColor: '#0D7377',
  },
  backButtonLabel: {
    color: '#0D7377',
  },
  continueButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#0D7377',
  },

  // Insurance Options
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: spacing[1],
  },
  optionCardSelected: {
    borderColor: '#0D7377',
    backgroundColor: '#F0FDF9',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[1.5],
  },
  radioOuterSelected: {
    borderColor: '#0D7377',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0D7377',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  optionDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  insuranceField: {
    marginTop: spacing[1],
  },

  // Terms
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
  },
  termsLink: {
    color: '#0D7377',
    fontWeight: '600',
  },

  // OTP
  otpDescription: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    marginTop: spacing[1],
  },
  otpContainer: {
    alignItems: 'center',
    marginVertical: spacing[3],
  },
  verifyButton: {
    borderRadius: 8,
    backgroundColor: '#0D7377',
    alignSelf: 'center',
    paddingHorizontal: spacing[4],
  },
  resendButton: {
    marginTop: spacing[1],
    alignSelf: 'center',
  },
  cooldownText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: spacing[1],
  },

  // Completion success
  completeContent: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  completeIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2E8540',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  completeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: spacing[1],
  },
  completeText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[3],
    paddingHorizontal: spacing[1],
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
    marginBottom: spacing[2],
    gap: spacing[1],
  },
  successBannerText: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '600',
  },

  // Sign in
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[3],
  },
  signInText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signInLink: {
    fontSize: 14,
    color: '#0D7377',
    fontWeight: '700',
  },
});
