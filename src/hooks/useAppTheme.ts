/**
 * useAppTheme - Theme-aware hook
 * Returns current theme colors and dark mode state
 * Wraps Paper's useTheme with typed PriceMyMeds tokens
 */

import { useTheme } from 'react-native-paper';
import { useSettingsStore } from '@/store/settingsStore';
import { colors as lightColorTokens } from '@/theme/colors';
import { darkColors as darkColorTokens } from '@/theme/darkColors';
import type { AppTheme } from '@/theme';

export function useAppTheme() {
  const paperTheme = useTheme<AppTheme>();
  // Derive from resolvedTheme (not themeMode) so 'system' mode honors the
  // device's color scheme — keeps brandColors in sync with the Paper theme
  // selected in the root layout. Otherwise 'system' + device-dark yields a
  // light brand palette over a dark Paper theme (e.g. invisible hero text).
  const isDark = useSettingsStore((s) => s.resolvedTheme === 'dark');
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);

  const brandColors = isDark ? darkColorTokens : lightColorTokens;

  return {
    ...paperTheme,
    isDark,
    themeMode,
    setThemeMode,
    brandColors,
  };
}
