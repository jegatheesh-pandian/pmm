/**
 * Drug API Service
 * Ported from Angular DrugApiService (519 LOC)
 * All drug-related API calls: search, config, prices, alternatives, popular, by-letter
 */

import apiClient from './apiClient';
import { ENDPOINTS } from '@/constants/api';
import { CHAIN_CODE_MAP } from '@/constants/pharmacy';
import type { ApiResponse } from '@/types/api';
import type { Drug, DrugSuggestion, DrugAlternative, BrandAlternative, QuantityOption } from '@/types/drug';
import type { PharmacyPrice } from '@/types/pharmacy';

// ─── Backend Response Types ──────────────────────────────────────────

interface BackendDrugSuggestion {
  name: string;
  seoUrlName: string;
}

interface BackendDrugConfig {
  seoName: string;
  seoUrlName: string;
  forms: string[];
  dosages: string[];
  quantities: string[];
  defaultForm: string;
  defaultDosage: string;
  defaultQuantity: string;
  ndc: string;
  brandGeneric: string;
  brandAlternatives?: {
    drugName: string;
    seoName: string;
    seoUrlName: string;
    brandGeneric: string;
    displayName: string;
    formStrengthQuantities: Record<string, Record<string, QuantityOption[]>>;
  }[];
}

interface BackendPharmacyPrice {
  pharmacyId: string;
  pharmacyName: string;
  chainCode?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone?: string;
  latitude?: string;
  longitude?: string;
  distance?: number;
  retailPrice: number;
  discountPrice: number;
  savingsAmount: number;
  savingsPercent: number;
  isLowestPrice: boolean;
  bin: string;
  pcn: string;
  group: string;
  memberId: string;
  apiSource?: string;
  logoUrl?: string;
}

export interface DrugPricesResponse {
  prices: PharmacyPrice[];
  drugDescription: string | null;
  imageReferences: string | null;
  drugMetaTitle: string | null;
  drugMetaDescriptions: string | null;
}

export interface DrugDescriptionResponse {
  ndc: string;
  drugName: string;
  genericName?: string;
  description?: string;
  shortDescription?: string;
  therapeuticClass?: string;
  uses?: string[];
  sideEffects?: { common?: string[]; serious?: string[] };
  warnings?: string[];
  contraindications?: string[];
  dosageInformation?: string;
  manufacturer?: string;
}

interface BackendDrugPricesResponse {
  drugName: string;
  form: string;
  dosage: string;
  quantity: string;
  ndc: string;
  zipCode: string;
  pharmacyPrices: BackendPharmacyPrice[];
  lowestPrice: number;
  maxSavingsPercent: number;
  pharmacyCount: number;
  timestamp: string;
  drugDescription?: string;
  imageReferences?: string;
  drugMetaTitle?: string;
  drugMetaDescriptions?: string;
}

// ─── Transform Helpers ───────────────────────────────────────────────

function mapChainCode(code?: string): string {
  if (!code) return 'independent';
  return CHAIN_CODE_MAP[code] ?? 'independent';
}

function transformBackendPrice(bp: BackendPharmacyPrice): PharmacyPrice {
  const chain = mapChainCode(bp.chainCode);
  return {
    pharmacy: {
      id: bp.pharmacyId,
      name: bp.pharmacyName,
      chain: chain as any,
      address: {
        street: bp.address,
        city: bp.city,
        state: bp.state,
        zipCode: bp.postalCode,
        latitude: bp.latitude ? parseFloat(bp.latitude) : undefined,
        longitude: bp.longitude ? parseFloat(bp.longitude) : undefined,
      },
      phone: bp.phone ?? '',
      hours: [],
      is24Hours: false,
      hasDriveThrough: false,
      hasHomeDelivery: false,
      hasOnlinePayment: false,
      distance: bp.distance ?? 0,
    },
    retailPrice: bp.retailPrice,
    discountPrice: bp.discountPrice,
    savingsAmount: bp.savingsAmount,
    savingsPercent: bp.savingsPercent,
    isLowestPrice: bp.isLowestPrice,
    bin: bp.bin,
    pcn: bp.pcn,
    group: bp.group,
    memberId: bp.memberId,
    apiSource: bp.apiSource,
  };
}

function transformSuggestion(bs: BackendDrugSuggestion): DrugSuggestion {
  return {
    id: bs.seoUrlName,
    slug: bs.seoUrlName,
    name: bs.name,
    genericName: bs.name,
    type: 'generic',
    drugClass: 'Other',
    matchType: 'name',
    matchedTerm: bs.name,
  };
}

function transformDrugConfig(bc: BackendDrugConfig): Drug {
  const brandAlts: BrandAlternative[] = (bc.brandAlternatives ?? []).map((ba) => ({
    drugName: ba.drugName,
    seoName: ba.seoName,
    seoUrlName: ba.seoUrlName,
    brandGeneric: ba.brandGeneric as 'Generic' | 'Brand',
    displayName: ba.displayName,
    formStrengthQuantities: ba.formStrengthQuantities,
  }));

  return {
    id: bc.seoUrlName,
    slug: bc.seoUrlName,
    name: bc.seoName,
    genericName: bc.seoName,
    brandNames: brandAlts.filter((b) => b.brandGeneric === 'Brand').map((b) => b.drugName),
    type: bc.brandGeneric?.toLowerCase() === 'brand' ? 'brand' : 'generic',
    drugClass: 'Other',
    forms: bc.forms as any[],
    dosages: bc.dosages,
    quantities: bc.quantities.map(Number).filter((n) => !isNaN(n)),
    ndc: bc.ndc,
    requiresPrescription: true,
    isControlled: false,
    isPopular: false,
    defaultForm: bc.defaultForm,
    defaultDosage: bc.defaultDosage,
    defaultQuantity: bc.defaultQuantity,
    brandAlternatives: brandAlts,
  };
}

// ─── API Methods ─────────────────────────────────────────────────────

export const drugApi = {
  async searchDrugs(query: string, limit: number = 10): Promise<DrugSuggestion[]> {
    if (query.length < 2) return [];
    const res = await apiClient.get<ApiResponse<BackendDrugSuggestion[]>>(
      `${ENDPOINTS.DRUGS_SEARCH}?name=${encodeURIComponent(query)}&limit=${limit}`,
    );
    if (res.data.success && Array.isArray(res.data.data)) {
      return res.data.data.map(transformSuggestion);
    }
    return [];
  },

  async getPopularDrugs(): Promise<Drug[]> {
    const res = await apiClient.get<ApiResponse<BackendDrugConfig[]>>(ENDPOINTS.DRUGS_POPULAR);
    if (res.data.success && Array.isArray(res.data.data)) {
      return res.data.data.map(transformDrugConfig);
    }
    return [];
  },

  async getDrugConfig(drugName: string): Promise<Drug | null> {
    const res = await apiClient.get<ApiResponse<BackendDrugConfig>>(
      `${ENDPOINTS.DRUGS_CONFIG}/${encodeURIComponent(drugName)}/config`,
    );
    if (res.data.success && res.data.data) {
      return transformDrugConfig(res.data.data);
    }
    return null;
  },

  async getDrugDescription(ndc: string): Promise<DrugDescriptionResponse | null> {
    const normalizedNdc = ndc.replace(/-/g, '');
    const res = await apiClient.get<ApiResponse<DrugDescriptionResponse>>(
      `${ENDPOINTS.DRUGS_DESCRIPTION}/${normalizedNdc}`,
    );
    if (res.data.success && res.data.data) {
      return res.data.data;
    }
    return null;
  },

  async getDrugPrices(params: {
    name: string;
    form: string;
    dosage: string;
    quantity: string | number;
    zipCode: string;
    latitude?: number;
    longitude?: number;
  }): Promise<DrugPricesResponse> {
    const qp = new URLSearchParams({
      name: params.name,
      form: params.form,
      dosage: params.dosage,
      quantity: String(params.quantity),
      zipCode: params.zipCode,
    });
    if (params.latitude) qp.set('latitude', String(params.latitude));
    if (params.longitude) qp.set('longitude', String(params.longitude));

    const res = await apiClient.get<ApiResponse<BackendDrugPricesResponse>>(
      `${ENDPOINTS.DRUGS_PRICES}?${qp.toString()}`,
    );

    if (res.data.success && res.data.data) {
      const d = res.data.data;
      return {
        prices: (d.pharmacyPrices ?? []).map(transformBackendPrice),
        drugDescription: d.drugDescription ?? null,
        imageReferences: d.imageReferences ?? null,
        drugMetaTitle: d.drugMetaTitle ?? null,
        drugMetaDescriptions: d.drugMetaDescriptions ?? null,
      };
    }

    return { prices: [], drugDescription: null, imageReferences: null, drugMetaTitle: null, drugMetaDescriptions: null };
  },

  async getDrugAlternatives(seoUrlName: string): Promise<DrugAlternative[]> {
    const res = await apiClient.get<ApiResponse<DrugAlternative[]>>(
      `${ENDPOINTS.DRUGS_ALTERNATIVES}/${encodeURIComponent(seoUrlName)}/alternatives`,
    );
    if (res.data.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  async getDrugsByLetter(
    letter: string,
    page: number = 0,
    size: number = 20,
  ): Promise<{ content: DrugSuggestion[]; totalElements: number; totalPages: number }> {
    const res = await apiClient.post<any>(
      `${ENDPOINTS.DRUGS_BY_LETTER}?letter=${letter}&page=${page}&size=${size}`,
      {},
    );
    // API returns Spring Page directly (no { success, data } wrapper)
    const payload = res.data?.data ?? res.data;
    const content = payload?.content ?? [];
    return {
      content: content.map((item: any) => ({
        ...transformSuggestion({ name: item.name, seoUrlName: item.seoUrlName }),
        type: item.brandGeneric?.toLowerCase() === 'brand' ? 'brand' : 'generic',
      })),
      totalElements: payload?.totalElements ?? 0,
      totalPages: payload?.totalPages ?? 0,
    };
  },
};
