/**
 * Login Screen
 * Matches PriceMyMeds.com web login:
 * - Centered PriceMyMeds logo
 * - "Welcome Back" title + subtitle
 * - White card: Phone Number, Password (with show/hide), Remember me + Forgot password
 * - Full-width "Sign In" button
 * - "Don't have an account? Create one for free" link
 */

import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
} from 'react-native';
import { Text, Button, Checkbox, Surface, Snackbar, Icon } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { loginSchema } from '@/utils/validation';
import { PhoneInput, PasswordInput } from '@/components/forms';
import { useAuthStore } from '@/store/authStore';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

interface LoginFormData {
  mobile: string;
  password: string;
}

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const authError = useAuthStore((s) => s.authError);
  const clearError = useAuthStore((s) => s.clearError);

  const [rememberMe, setRememberMe] = useState(false);
  const insets = useSafeAreaInsets();

  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: { mobile: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    const success = await login({
      mobile: data.mobile,
      password: data.password,
      rememberMe,
    });
    if (success) {
      router.replace('/(tabs)/account');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#F0FDF9', '#FFFFFF', '#F0FDF9']} style={styles.flex}>
        {/* Top bar: back to public home */}
        <View style={[styles.topBar, { paddingTop: insets.top + spacing[1] }]}>
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={styles.backBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back to home"
          >
            <Icon source="arrow-left" size={22} color={colors.textSecondary} />
            <Text style={styles.backBtnText}>Home</Text>
          </Pressable>
        </View>

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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to access your saved medications and price alerts
          </Text>

          {/* Form Card */}
          <Surface style={styles.card} elevation={1}>
            <PhoneInput control={control} name="mobile" testID="login-phone" />

            <PasswordInput
              control={control}
              name="password"
              label="Password"
              testID="login-password"
            />

            <View style={styles.optionsRow}>
              <Pressable
                style={styles.rememberRow}
                onPress={() => setRememberMe((prev) => !prev)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: rememberMe }}
              >
                <Checkbox.Android
                  status={rememberMe ? 'checked' : 'unchecked'}
                  color={colors.primary}
                />
                <Text style={styles.rememberText}>Remember me</Text>
              </Pressable>

              <Link href="/(auth)/forgot-password" asChild>
                <Pressable hitSlop={8}>
                  <Text style={styles.forgotLink}>Forgot password?</Text>
                </Pressable>
              </Link>
            </View>

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
              style={styles.submitButton}
              contentStyle={styles.submitContent}
              labelStyle={styles.submitLabel}
              testID="login-submit"
            >
              Sign In
            </Button>
          </Surface>

          {/* Create Account */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don&apos;t have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <Pressable hitSlop={8}>
                <Text style={styles.registerLink}>Create one for free</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </LinearGradient>

      <Snackbar
        visible={!!authError}
        onDismiss={clearError}
        duration={4000}
        action={{ label: 'Dismiss', onPress: clearError }}
        style={styles.snackbar}
      >
        {authError ?? ''}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    paddingHorizontal: spacing[2],
    paddingBottom: spacing[1],
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: spacing[0.5],
    paddingRight: spacing[1],
  },
  backBtnText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 4,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2],
    paddingBottom: spacing[6],
  },
  logo: {
    width: 220,
    height: 52,
    marginBottom: spacing[3],
  },
  title: {
    fontSize: 26,
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
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[1],
    marginBottom: spacing[1],
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8,
  },
  rememberText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  forgotLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: spacing[1],
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  submitContent: {
    paddingVertical: spacing[1],
  },
  submitLabel: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[3],
    flexWrap: 'wrap',
  },
  registerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  registerLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '700',
  },
  snackbar: {
    backgroundColor: colors.error,
  },
});
