/**
 * Root Layout
 * Wraps the entire app with providers:
 * - React Native Paper (theme with dark mode)
 * - React Query (data fetching)
 * - SafeAreaProvider
 * - Toast notifications
 * - Error boundary
 * - Network status banner
 * - Auth session restoration
 */

import { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import NetInfo from '@react-native-community/netinfo';
import * as SplashScreen from 'expo-splash-screen';
import { lightTheme, darkTheme } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { NetworkBanner } from '@/components/ui/NetworkBanner';
import { ToastProvider } from '@/providers/ToastProvider';

SplashScreen.preventAutoHideAsync();

// Sync React Query online status with NetInfo
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const isRestoringSession = useAuthStore((s) => s.isRestoringSession);
  const restoreZipCode = useSettingsStore((s) => s.restoreZipCode);
  const restoreTheme = useSettingsStore((s) => s.restoreTheme);
  const resolvedTheme = useSettingsStore((s) => s.resolvedTheme);

  const activeTheme = resolvedTheme === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    async function init() {
      await Promise.all([restoreSession(), restoreZipCode(), restoreTheme()]);
      await SplashScreen.hideAsync();
    }
    init();
  }, [restoreSession, restoreZipCode, restoreTheme]);

  if (isRestoringSession) {
    return null; // Splash screen stays visible
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <PaperProvider theme={activeTheme}>
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary>
              <ToastProvider>
                <View style={styles.flex}>
                  <NetworkBanner />
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      animation: 'slide_from_right',
                      contentStyle: {
                        backgroundColor: activeTheme.colors.background,
                      },
                    }}
                  />
                </View>
              </ToastProvider>
            </ErrorBoundary>
            <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
          </QueryClientProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
