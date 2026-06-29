/**
 * Reset Password Screen
 * Ported from Angular ResetPasswordComponent
 * 4 view states: loading -> form -> success -> expired
 * Token from deep link URL, cleared after reading for security
 */

import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Surface, ActivityIndicator, Snackbar } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { PasswordInput } from '@/components/forms';
import apiClient from '@/services/api/apiClient';
import { ENDPOINTS } from '@/constants/api';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

type ViewState = 'loading' | 'form' | 'success' | 'expired';

const resetSchema = yup.object({
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Minimum 8 characters')
    .matches(/[A-Z]/, 'Must contain an uppercase letter')
    .matches(/[a-z]/, 'Must contain a lowercase letter')
    .matches(/[0-9]/, 'Must contain a number'),
  confirmPassword: yup
    .string()
    .required('Confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

type ResetFormData = yup.InferType<typeof resetSchema>;

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResetFormData>({
    resolver: yupResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  // Read and clear token from URL params (security: remove from URL after reading)
  useEffect(() => {
    const urlToken = params.token;
    if (urlToken) {
      setToken(urlToken);
      setViewState('form');
      // Clear token from URL for security
      router.setParams({ token: '' });
    } else {
      setViewState('expired');
    }
  }, [params.token]);

  const handleSubmit = async (data: ResetFormData) => {
    if (!token) {
      setViewState('expired');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.post(ENDPOINTS.AUTH_RESET_PASSWORD, {
        token,
        newPassword: data.password,
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
        setViewState('expired');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to reset password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Loading */}
      {viewState === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Validating reset link...
          </Text>
        </View>
      )}

      {/* Form */}
      {viewState === 'form' && (
        <View style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>
            Create New Password
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Enter a new password for your account.
          </Text>

          <PasswordInput control={form.control} name="password" label="New Password" showStrength />

          <PasswordInput
            control={form.control}
            name="confirmPassword"
            label="Confirm New Password"
          />

          <Button
            mode="contained"
            onPress={form.handleSubmit(handleSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Reset Password
          </Button>
        </View>
      )}

      {/* Success */}
      {viewState === 'success' && (
        <View style={styles.center}>
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.successIcon}>&#10003;</Text>
            <Text variant="headlineSmall" style={styles.cardTitle}>
              Password Reset!
            </Text>
            <Text variant="bodyMedium" style={styles.cardText}>
              Your password has been successfully updated. You can now sign in with your new
              password.
            </Text>
            <Button
              mode="contained"
              onPress={() => router.replace('/(auth)/login')}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Sign In
            </Button>
          </Surface>
        </View>
      )}

      {/* Expired */}
      {viewState === 'expired' && (
        <View style={styles.center}>
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.expiredIcon}>!</Text>
            <Text variant="headlineSmall" style={styles.cardTitle}>
              Link Expired
            </Text>
            <Text variant="bodyMedium" style={styles.cardText}>
              This password reset link has expired or is invalid. Please request a new one.
            </Text>
            <Button
              mode="contained"
              onPress={() => router.replace('/(auth)/forgot-password')}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Request New Link
            </Button>
            <Button
              mode="text"
              onPress={() => router.replace('/(auth)/login')}
              style={styles.backLink}
            >
              Back to Sign In
            </Button>
          </Surface>
        </View>
      )}

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
        action={{ label: 'Dismiss', onPress: () => setError(null) }}
        style={styles.snackbar}
      >
        {error ?? ''}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: spacing[3],
    paddingTop: spacing[6],
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[8],
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
  loadingText: {
    color: colors.textSecondary,
    marginTop: spacing[2],
  },
  card: {
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  cardTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  cardText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  successIcon: {
    fontSize: 48,
    color: colors.success,
    marginBottom: spacing[2],
  },
  expiredIcon: {
    fontSize: 48,
    color: colors.warning,
    fontWeight: '700',
    marginBottom: spacing[2],
  },
  button: {
    marginTop: spacing[2],
    borderRadius: 8,
    width: '100%',
  },
  buttonContent: {
    paddingVertical: spacing[1],
  },
  backLink: {
    marginTop: spacing[1],
  },
  snackbar: {
    backgroundColor: colors.error,
  },
});
