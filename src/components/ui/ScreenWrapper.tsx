/**
 * ScreenWrapper - Common screen container
 * Provides SafeArea, theme-aware background, scroll, and pull-to-refresh
 */

import { type ReactNode, useCallback, useState } from 'react';
import { StyleSheet, ScrollView, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';
import { BrandHeader } from './BrandHeader';

interface ScreenWrapperProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  onRefresh?: () => Promise<void>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Show the PriceMyMeds logo bar fixed at the top of the screen. */
  showLogo?: boolean;
}

export function ScreenWrapper({
  children,
  scroll = true,
  padded = true,
  onRefresh,
  edges = ['top', 'left', 'right'],
  showLogo = true,
}: ScreenWrapperProps) {
  const { colors } = useAppTheme();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const content = (
    <View style={[styles.inner, padded && styles.padded]}>{children}</View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={edges}
    >
      {showLogo && <BrandHeader />}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
  },
  padded: {
    padding: spacing[2],
  },
});
