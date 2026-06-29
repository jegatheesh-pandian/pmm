/**
 * Account Stack Layout - Auth Guard
 * For screens that live outside tabs (alerts, history, family)
 * Dashboard, Medications, Settings are now inside (tabs)/account/
 */

import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function AccountLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { colors } = useAppTheme();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="alerts" options={{ title: 'Price Alerts' }} />
      <Stack.Screen name="history" options={{ title: 'History' }} />
      <Stack.Screen name="family" options={{ title: 'Family Members' }} />
      <Stack.Screen name="family-member" options={{ title: 'Family Member' }} />
    </Stack>
  );
}
