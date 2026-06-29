/**
 * Medication types - ported from Angular medication.model.ts
 */

export interface SavedMedicationResponse {
  medItemId: string;
  drugInformationMedispanId: number;
  drugName: string;
  genericName?: string;
  form: string;
  dosage: string;
  quantity: string;
  brandGeneric: 'Generic' | 'Brand';
  ndc?: string;
  seoUrlName?: string;
  preferredPharmacyId?: string;
  preferredPharmacyName?: string;
  currentBestPrice?: number;
  retailPrice?: number;
  refillReminderEnabled: boolean;
  refillIntervalDays?: number;
  lastFilledDate?: string;
  nextRefillDate?: string;
  priceAlertEnabled: boolean;
  priceAlertThreshold?: number;
  createdDate: string;
  lastModifiedDate: string;
}

export interface SaveMedicationRequest {
  drugInformationMedispanId: number;
  ndc?: string;
  preferredPharmacyId?: string;
  preferredPharmacyName?: string;
  currentBestPrice?: number;
  retailPrice?: number;
}

export interface UpdateMedicationRequest {
  ndc?: string;
  form?: string;
  dosage?: string;
  quantity?: number;
  preferredPharmacyId?: string;
  preferredPharmacyName?: string;
  currentBestPrice?: number;
  retailPrice?: number;
  refillReminderEnabled?: boolean;
  refillIntervalDays?: number;
  lastFilledDate?: string;
  nextRefillDate?: string;
  priceAlertEnabled?: boolean;
  priceAlertThreshold?: number;
}
