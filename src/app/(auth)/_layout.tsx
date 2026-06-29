/**
 * Auth Layout - Guest Guard
 * Redirects authenticated users to the account tab
 * Ported from Angular guestGuard
 */

import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/account" />;
  }

  return (
    <Stack
      screenOptions={{
        // Auth screens render their own logo header, so hide the native
        // navigation bar to avoid a duplicate title/menu on top.
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="member-register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
