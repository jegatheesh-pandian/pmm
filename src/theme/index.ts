/**
 * PriceMyMeds - React Native Paper Theme
 * Light + Dark themes with PriceMyMeds brand tokens
 */

import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { colors } from './colors';
import { darkColors } from './darkColors';
import { fontFamily } from './typography';

export { colors } from './colors';
export { darkColors } from './darkColors';
export { fontSize, fontWeight, lineHeight, fontFamily } from './typography';
export { spacing, borderRadius, shadow } from './spacing';

const fontConfig = {
  fontFamily,
};

export const lightTheme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    tertiary: colors.accent,
    tertiaryContainer: colors.accentLight,
    error: colors.error,
    errorContainer: colors.errorLight,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.neutral100,
    onPrimary: colors.textInverse,
    onPrimaryContainer: colors.primaryDark,
    onSecondary: colors.textInverse,
    onSecondaryContainer: colors.secondaryDark,
    onTertiary: colors.textInverse,
    onTertiaryContainer: colors.accentDark,
    onSurface: colors.textPrimary,
    onSurfaceVariant: colors.textSecondary,
    onBackground: colors.textPrimary,
    onError: colors.textInverse,
    outline: colors.border,
    outlineVariant: colors.neutral200,
    inverseSurface: colors.neutralDark,
    inverseOnSurface: colors.textInverse,
    inversePrimary: colors.primaryLight,
    shadow: '#000000',
    scrim: colors.scrim,
    elevation: {
      level0: 'transparent',
      level1: colors.surface,
      level2: colors.surface,
      level3: colors.surface,
      level4: colors.surface,
      level5: colors.surface,
    },
  },
  roundness: 8,
} as const;

export const darkTheme = {
  ...MD3DarkTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkColors.primary,
    primaryContainer: darkColors.primaryLight,
    secondary: darkColors.secondary,
    secondaryContainer: darkColors.secondaryLight,
    tertiary: darkColors.accent,
    tertiaryContainer: darkColors.accentLight,
    error: darkColors.error,
    errorContainer: darkColors.errorLight,
    background: darkColors.background,
    surface: darkColors.surface,
    surfaceVariant: darkColors.neutral100,
    onPrimary: darkColors.textInverse,
    onPrimaryContainer: darkColors.primaryDark,
    onSecondary: darkColors.textInverse,
    onSecondaryContainer: darkColors.secondaryDark,
    onTertiary: darkColors.textInverse,
    onTertiaryContainer: darkColors.accentDark,
    onSurface: darkColors.textPrimary,
    onSurfaceVariant: darkColors.textSecondary,
    onBackground: darkColors.textPrimary,
    onError: darkColors.textInverse,
    outline: darkColors.border,
    outlineVariant: darkColors.neutral200,
    inverseSurface: darkColors.neutralDark,
    inverseOnSurface: darkColors.textInverse,
    inversePrimary: darkColors.primaryLight,
    shadow: '#000000',
    scrim: darkColors.scrim,
    elevation: {
      level0: 'transparent',
      level1: darkColors.surface,
      level2: darkColors.surfaceElevated,
      level3: darkColors.surfaceElevated,
      level4: darkColors.surfaceElevated,
      level5: darkColors.surfaceElevated,
    },
  },
  roundness: 8,
} as const;

/** @deprecated Use lightTheme or darkTheme instead */
export const theme = lightTheme;

export type AppTheme = typeof lightTheme;
