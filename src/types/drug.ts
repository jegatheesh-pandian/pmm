/**
 * Drug types - ported from Angular drug.model.ts
 */

export type DrugForm =
  | 'Tablet' | 'Capsule' | 'Liquid' | 'Injection' | 'Cream'
  | 'Ointment' | 'Patch' | 'Inhaler' | 'Drops' | 'Suppository' | 'Powder';

export type DrugType = 'generic' | 'brand';

export type DrugClass =
  | 'Cholesterol' | 'Blood Pressure' | 'Diabetes' | 'Depression' | 'Anxiety'
  | 'Pain Relief' | 'Antibiotic' | 'Allergy' | 'Thyroid' | 'Heart'
  | 'Asthma' | 'Acid Reflux' | 'Skin' | 'Vitamin' | 'Other';

export interface Drug {
  id: string;
  slug: string;
  name: string;
  genericName: string;
  brandNames: string[];
  type: DrugType;
  drugClass: DrugClass;
  forms: DrugForm[];
  dosages: string[];
  quantities: number[];
  ndc?: string;
  description?: string;
  uses?: string[];
  sideEffects?: string[];
  warnings?: string[];
  requiresPrescription: boolean;
  isControlled: boolean;
  deaSchedule?: 'I' | 'II' | 'III' | 'IV' | 'V';
  isPopular: boolean;
  defaultForm?: string;
  defaultDosage?: string;
  defaultQuantity?: string;
  imageUrl?: string;
  brandAlternatives?: BrandAlternative[];
}

export interface DrugSuggestion {
  id: string;
  slug: string;
  name: string;
  genericName: string;
  type: DrugType;
  drugClass: DrugClass;
  matchType: 'name' | 'generic' | 'brand';
  matchedTerm: string;
}

export interface DrugConfiguration {
  drugId: string;
  form: DrugForm;
  dosage: string;
  quantity: number;
  zipCode: string;
}

export interface BrandAlternative {
  drugName: string;
  seoName: string;
  seoUrlName: string;
  brandGeneric: 'Generic' | 'Brand';
  displayName: string;
  formStrengthQuantities: Record<string, Record<string, QuantityOption[]>>;
}

export interface QuantityOption {
  quantity: string;
  ndc: string;
  gpi: string;
  drugInformationMedispanId: number;
  isDefault: boolean;
}

export interface DrugAlternative {
  drugName: string;
  seoUrlName: string;
  brandGeneric: 'Generic' | 'Brand';
  drugClass: string;
}

export interface DrugSearchParams {
  query: string;
  limit?: number;
  drugClass?: DrugClass;
  type?: DrugType;
}
