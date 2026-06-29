/**
 * Storage key constants
 * SecureStore for sensitive data, AsyncStorage for preferences
 */

/** Expo SecureStore keys (encrypted at rest) */
export const SECURE_KEYS = {
  AUTH_TOKENS: 'pmm_auth',
  USER_DATA: 'pmm_user',
} as const;

/** AsyncStorage keys (non-sensitive preferences) */
export const STORAGE_KEYS = {
  USER_ZIPCODE: 'pmm_user_zipcode',
  ONBOARDING_COMPLETE: 'pmm_onboarding_complete',
  THEME_PREFERENCE: 'pmm_theme',
  PRIVACY_PREFS: 'pmm_privacy_prefs',
} as const;
