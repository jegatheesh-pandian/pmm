/**
 * BrandHeader - Centered PriceMyMeds logo bar shown at the top of pages.
 * Rendered on a light surface so the green/orange wordmark stays legible
 * (it would not show on the teal hero gradients).
 *
 * Use `safeTop` when placing this outside a SafeAreaView (e.g. screens with
 * their own full-screen layout) so it clears the status bar.
 */

import { View, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';

interface BrandHeaderProps {
  /** Add top safe-area inset (use when not already inside a SafeAreaView). */
  safeTop?: boolean;
}

export function BrandHeader({ safeTop = false }: BrandHeaderProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.outlineVariant,
          paddingTop: spacing[1] + (safeTop ? insets.top : 0),
        },
      ]}
    >
      <Image
        source={require('@/assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="PriceMyMeds"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing[1],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logo: {
    width: 150,
    height: 30,
  },
});
