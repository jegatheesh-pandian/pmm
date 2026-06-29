/**
 * PriceMyMeds Design Tokens - Dark Theme Colors
 * Inverted palette with adjusted contrast ratios for WCAG AA
 */

export const darkColors = {
  // Brand (lightened for dark backgrounds)
  primary: '#14B8BC',
  primaryLight: '#0D3D3E',
  primaryDark: '#5EEAD4',

  secondary: '#4ADE80',
  secondaryLight: '#14332A',
  secondaryDark: '#86EFAC',

  accent: '#F59E0B',
  accentLight: '#422006',
  accentDark: '#FCD34D',

  // Semantic
  error: '#EF4444',
  errorLight: '#450A0A',
  warning: '#F59E0B',
  warningLight: '#422006',
  info: '#60A5FA',
  infoLight: '#172554',
  success: '#4ADE80',
  successLight: '#14332A',

  // Neutral
  neutralDark: '#F9FAFB',
  neutral700: '#D1D5DB',
  neutral600: '#9CA3AF',
  neutral500: '#6B7280',
  neutral400: '#4B5563',
  neutral300: '#374151',
  neutral200: '#1F2937',
  neutral100: '#111827',

  // Surface
  background: '#0F172A',
  surface: '#1E293B',
  surfaceElevated: '#334155',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: '#0F172A',
  textLink: '#14B8BC',

  // Border
  border: '#334155',
  borderFocused: '#14B8BC',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  scrim: 'rgba(0, 0, 0, 0.5)',
} as const;
