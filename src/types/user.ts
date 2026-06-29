/**
 * User types - ported from Angular user.model.ts
 */

export enum UserAccountType {
  GENERAL_PUBLIC = 'general_public',
  HEALTH_PLAN_MEMBER = 'health_plan_member',
}

export enum AccountStatus {
  ACTIVE = 'active',
  PENDING_VERIFICATION = 'pending_verification',
  SUSPENDED = 'suspended',
  PENDING_CONVERSION = 'pending_conversion',
  DELETED = 'deleted',
}

export enum MembershipStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  CONVERTED = 'converted',
}

export interface DeductibleInfo {
  annualDeductible: number;
  deductibleMet: number;
  deductibleRemaining: number;
  planYear: string;
  lastUpdated: string;
}

export interface CopayTier {
  tier: number;
  name: string;
  copayAmount: number;
  coinsurancePercent?: number;
}

export interface HealthPlanMembership {
  partnerId: string;
  partnerName: string;
  memberId?: string;
  planName?: string;
  planTier?: string;
  status: MembershipStatus;
  verificationMethod: 'sso' | 'member_id' | 'email_domain' | 'access_code';
  verifiedAt: string;
  effectiveDate: string;
  terminationDate?: string;
  deductibleInfo?: DeductibleInfo;
  copayTiers?: CopayTier[];
}

export interface SavedMedication {
  id: string;
  drugInformationMedispanId: number;
  drugName: string;
  genericName?: string;
  form: string;
  dosage: string;
  quantity: number | string;
  brandGeneric?: 'Generic' | 'Brand';
  ndc?: string;
  seoUrlName?: string;
  preferredPharmacyId?: string;
  preferredPharmacyName?: string;
  currentBestPrice?: number;
  retailPrice?: number;
  refillReminderEnabled: boolean;
  refillIntervalDays?: number;
  nextRefillDate?: string;
  priceAlertEnabled: boolean;
  priceAlertThreshold?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PriceAlert {
  id: string;
  drugId: string;
  drugName: string;
  form: string;
  dosage: string;
  quantity: number;
  alertType: 'any_drop' | 'below_threshold' | 'percent_drop';
  threshold?: number;
  percentThreshold?: number;
  deliveryChannels: ('email' | 'sms' | 'push')[];
  frequency: 'immediate' | 'daily_digest';
  isActive: boolean;
  lastTriggeredAt?: string;
  createdAt: string;
}

export interface CouponHistoryEntry {
  id: string;
  drugName: string;
  form: string;
  dosage: string;
  quantity: number;
  pharmacyName: string;
  pharmacyAddress: string;
  discountPrice: number;
  retailPrice: number;
  savingsAmount: number;
  savingsPercent: number;
  bin: string;
  pcn: string;
  groupId: string;
  memberId: string;
  generatedAt: string;
  usedAt?: string;
  deliveryMethod: 'view' | 'print' | 'email' | 'sms';
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: 'self' | 'spouse' | 'child' | 'parent' | 'other';
  isDefault: boolean;
  savedMedications: SavedMedication[];
  createdAt: string;
}

export interface NotificationPreferences {
  email: {
    priceAlerts: boolean;
    refillReminders: boolean;
    savingsTips: boolean;
    productUpdates: boolean;
  };
  sms: {
    priceAlerts: boolean;
    refillReminders: boolean;
  };
  push: {
    priceAlerts: boolean;
    refillReminders: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified?: boolean;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  smsConsent?: boolean;
  accountType: UserAccountType;
  accountStatus: AccountStatus;
  healthPlanMembership?: HealthPlanMembership;
  defaultZipCode?: string;
  preferredPharmacyId?: string;
  savedMedications: SavedMedication[];
  priceAlerts: PriceAlert[];
  couponHistory: CouponHistoryEntry[];
  familyMembers: FamilyMember[];
  notificationPreferences: NotificationPreferences;
  totalSavings: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface LoginCredentials {
  mobile: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  errorCode?: string;
  errorMessage?: string;
}
