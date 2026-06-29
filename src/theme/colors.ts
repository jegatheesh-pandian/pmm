/**
 * PriceMyMeds Design Tokens - Colors
 * Ported from Angular CSS custom properties
 */

export const colors = {
  // Brand
  primary: '#0D7377',
  primaryLight: '#E6F3F3',
  primaryDark: '#095456',

  secondary: '#2E8540',
  secondaryLight: '#E8F5E9',
  secondaryDark: '#1B5E20',

  accent: '#B45309',
  accentLight: '#FEF3C7',
  accentDark: '#92400E',

  // Semantic
  error: '#DC2626',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  success: '#2E8540',
  successLight: '#E8F5E9',

  // Neutral
  neutralDark: '#1A1A2E',
  neutral700: '#374151',
  neutral600: '#4B5563',
  neutral500: '#6B7280',
  neutral400: '#9CA3AF',
  neutral300: '#D1D5DB',
  neutral200: '#E5E7EB',
  neutral100: '#F3F4F6',

  // Surface
  background: '#F8FAFB',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#4B5563',
  textTertiary: '#6B7280',
  textInverse: '#FFFFFF',
  textLink: '#0D7377',

  // Border
  border: '#E5E7EB',
  borderFocused: '#0D7377',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  scrim: 'rgba(0, 0, 0, 0.32)',
} as const;

export type ColorToken = keyof typeof colors;
