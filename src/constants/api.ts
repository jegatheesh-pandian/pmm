/**
 * API Configuration
 * Base URL and endpoint constants
 */

// Production API on Dokploy
export const API_BASE_URL = 'https://pricemymedsjega.apps.greenbackhealth.com/api/v1';

export const ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_REFRESH_TOKEN: '/auth/refresh-token',
  AUTH_SEND_OTP: '/auth/send-otp',
  AUTH_VERIFY_OTP: '/auth/verify-otp',
  AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/auth/reset-password',

  // User Profile
  USER_ME: '/users/me',
  USER_CHANGE_PASSWORD: '/users/me/change-password',
  USER_EMAIL: '/users/me/email',
  USER_EMAIL_VERIFY: '/users/me/email/verify',
  USER_SEND_OTP: '/users/me/send-otp',
  USER_VERIFY_OTP: '/users/me/verify-otp',
  USER_DELETE: '/users/me/delete',
  USER_EXPORT: '/users/me/export',

  // Drugs
  DRUGS_SEARCH: '/drugs/search',
  DRUGS_POPULAR: '/drugs/popular',
  DRUGS_CONFIG: '/drugs', // /{drugName}/config
  DRUGS_DESCRIPTION: '/drugs/description', // /{ndc}
  DRUGS_PRICES: '/drugs/prices',
  DRUGS_ALTERNATIVES: '/drugs', // /{seoUrlName}/alternatives
  DRUGS_BY_LETTER: '/common/getDrugsByLetter',
  DRUGS_SEO: '/drugs', // /{slug}/seo

  // Pharmacies
  PHARMACIES_SEARCH: '/pharmacies/search',
  PHARMACIES_NEARBY: '/pharmacies/nearby',
  PHARMACIES_DETAIL: '/pharmacies', // /{pharmacyId}

  // Conditions
  CONDITIONS_TOP: '/conditions/top',
  CONDITIONS_ALPHABET: '/conditions/alphabet', // /{letter}
  CONDITIONS_DETAIL: '/conditions', // /{conditionName}
  CONDITIONS_DRUGS: '/conditions', // /{conditionName}/drugs
  CONDITIONS_FAQS: '/conditions', // /{conditionName}/faqs
  CONDITIONS_BLOG: '/conditions', // /{slug}/blog
  CONDITIONS_BLOG_EXISTS: '/conditions/blog/exists', // /{slug}

  // Coupons
  COUPONS_SEND_EMAIL: '/coupons/send/email',
  COUPONS_SEND_SMS: '/coupons/send/sms',
  COUPONS_CAPTURE: '/coupons/capture',

  // Medications
  MEDICATIONS: '/medications',
  MEDICATIONS_CHECK: '/medications/check', // /{drugInformationMedispanId}

  // General Registration
  GENERAL_REG_CHECK_EMAIL: '/general-registration/check-email',
  GENERAL_REG_CHECK_MOBILE: '/general-registration/check-mobile',
  GENERAL_REG_STEP1: '/general-registration/step1',
  GENERAL_REG_STEP2: '/general-registration/step2',
  GENERAL_REG_VERIFY_INSURANCE: '/general-registration/verify-insurance',
  GENERAL_REG_VERIFY_OTP: '/general-registration/verify-otp',
  GENERAL_REG_RESEND_OTP: '/general-registration/resend-otp',
  GENERAL_REG_COMPLETE: '/general-registration/complete',
  GENERAL_REG_STATUS: '/general-registration/status',

  // Member Registration
  MEMBER_REG_CHECK_ELIGIBILITY: '/member-registration/check-eligibility',
  MEMBER_REG_CHECK_EMAIL: '/member-registration/check-email',
  MEMBER_REG_CHECK_MOBILE: '/member-registration/check-mobile',
  MEMBER_REG_REGISTER: '/member-registration/register',
  MEMBER_REG_VERIFY_OTP: '/member-registration/verify-otp',
  MEMBER_REG_RESEND_OTP: '/member-registration/resend-otp',
  MEMBER_REG_COMPLETE: '/member-registration/complete',
} as const;

/** Endpoints that should NOT have auth token attached */
export const AUTH_WHITELIST = [
  ENDPOINTS.AUTH_LOGIN,
  ENDPOINTS.AUTH_REGISTER,
  ENDPOINTS.AUTH_REFRESH_TOKEN,
] as const;

/** Token refresh config */
export const TOKEN_CONFIG = {
  REFRESH_TOKEN_VALIDITY_DAYS: 7,
  ACCESS_TOKEN_BUFFER_MS: 10_000, // 10s before expiry
} as const;
