/**
 * Pharmacy API service
 * Ported from Angular PharmacyApiService
 * Handles pharmacy search, nearby lookup, and detail fetching
 */

import apiClient from './apiClient';
import { ENDPOINTS } from '@/constants/api';
import { CHAIN_CODE_MAP, PHARMACY_BRANDS } from '@/constants/pharmacy';
import type {
  Pharmacy,
  PharmacyWithDistance,
  PharmacyChain,
  Address,
  PharmacyHours,
} from '@/types/pharmacy';

// ── Backend Response Types ──────────────────────────────────────────

interface BackendPharmacy {
  pharmacyId?: string;
  id?: string;
  ncpdpId?: string;
  name: string;
  chainCode?: string;
  chain?: string;
  storeNumber?: string;
  address1?: string;
  address2?: string;
  street?: string;
  city: string;
  state: string;
  zip?: string;
  zipCode?: string;
  phone?: string;
  phoneNumber?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  distance?: number;
  distanceMiles?: number;
  driveTimeMinutes?: number;
  is24Hours?: boolean;
  has24Hours?: boolean;
  hasDriveThrough?: boolean;
  hasHomeDelivery?: boolean;
  hasOnlinePayment?: boolean;
  hours?: BackendPharmacyHours[];
  rating?: number;
  reviewCount?: number;
  logoUrl?: string;
}

interface BackendPharmacyHours {
  day: string;
  openTime?: string;
  open?: string;
  closeTime?: string;
  close?: string;
  isClosed?: boolean;
  closed?: boolean;
}

interface BackendSearchResponse {
  pharmacies?: BackendPharmacy[];
  results?: BackendPharmacy[];
  content?: BackendPharmacy[];
  totalElements?: number;
  totalResults?: number;
  total?: number;
}

// ── Search Parameters ───────────────────────────────────────────────

export interface PharmacySearchParams {
  zipCode: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  page?: number;
  size?: number;
  chain?: string;
  is24Hours?: boolean;
  hasDriveThrough?: boolean;
}

// ── Transform Functions ─────────────────────────────────────────────

function resolveChain(pharmacy: BackendPharmacy): PharmacyChain {
  if (pharmacy.chain) return pharmacy.chain as PharmacyChain;
  if (pharmacy.chainCode) {
    const mapped = CHAIN_CODE_MAP[pharmacy.chainCode];
    if (mapped) return mapped as PharmacyChain;
  }
  // Try to infer from name
  const nameLower = (pharmacy.name || '').toLowerCase();
  for (const [chain, brand] of Object.entries(PHARMACY_BRANDS)) {
    if (nameLower.includes(brand.shortName.toLowerCase())) {
      return chain as PharmacyChain;
    }
  }
  return 'independent';
}

function transformAddress(p: BackendPharmacy): Address {
  return {
    street: p.address1 || p.street || '',
    city: p.city || '',
    state: p.state || '',
    zipCode: p.zip || p.zipCode || '',
    latitude: p.latitude ?? p.lat,
    longitude: p.longitude ?? p.lng,
  };
}

function transformHours(hours?: BackendPharmacyHours[]): PharmacyHours[] {
  if (!hours || hours.length === 0) return [];
  return hours.map((h) => ({
    day: h.day as PharmacyHours['day'],
    open: h.openTime || h.open || '',
    close: h.closeTime || h.close || '',
    isClosed: h.isClosed ?? h.closed ?? false,
  }));
}

function transformPharmacy(p: BackendPharmacy): PharmacyWithDistance {
  return {
    id: p.pharmacyId || p.id || p.ncpdpId || '',
    name: p.name || '',
    chain: resolveChain(p),
    storeNumber: p.storeNumber,
    address: transformAddress(p),
    phone: p.phone || p.phoneNumber || '',
    hours: transformHours(p.hours),
    is24Hours: p.is24Hours ?? p.has24Hours ?? false,
    hasDriveThrough: p.hasDriveThrough ?? false,
    hasHomeDelivery: p.hasHomeDelivery ?? false,
    hasOnlinePayment: p.hasOnlinePayment ?? false,
    rating: p.rating,
    reviewCount: p.reviewCount,
    logoUrl: p.logoUrl,
    distance: p.distance ?? p.distanceMiles ?? 0,
    driveTimeMinutes: p.driveTimeMinutes,
  };
}

// ── API Functions ───────────────────────────────────────────────────

/** Search pharmacies by ZIP code with optional filters */
export async function searchPharmacies(
  params: PharmacySearchParams,
): Promise<{ pharmacies: PharmacyWithDistance[]; total: number }> {
  const { data } = await apiClient.get<BackendSearchResponse>(
    ENDPOINTS.PHARMACIES_SEARCH,
    {
      params: {
        zipCode: params.zipCode,
        latitude: params.latitude,
        longitude: params.longitude,
        radius: params.radius ?? 25,
        page: params.page ?? 0,
        size: params.size ?? 20,
        chain: params.chain,
        is24Hours: params.is24Hours,
        hasDriveThrough: params.hasDriveThrough,
      },
    },
  );

  const raw = data.pharmacies || data.results || data.content || [];
  const total = data.totalElements ?? data.totalResults ?? data.total ?? raw.length;

  return {
    pharmacies: raw.map(transformPharmacy),
    total,
  };
}

/** Get nearby pharmacies by ZIP code */
export async function getNearbyPharmacies(
  zipCode: string,
  radius: number = 10,
  latitude?: number,
  longitude?: number,
): Promise<PharmacyWithDistance[]> {
  const { data } = await apiClient.get<BackendSearchResponse>(
    ENDPOINTS.PHARMACIES_NEARBY,
    {
      params: { zipCode, radius, latitude, longitude },
    },
  );

  const raw = data.pharmacies || data.results || data.content || [];
  return raw.map(transformPharmacy);
}

/** Get pharmacy detail by ID */
export async function getPharmacyById(
  pharmacyId: string,
): Promise<PharmacyWithDistance> {
  const { data } = await apiClient.get<BackendPharmacy>(
    `${ENDPOINTS.PHARMACIES_DETAIL}/${pharmacyId}`,
  );
  return transformPharmacy(data);
}

export const pharmacyApi = {
  searchPharmacies,
  getNearbyPharmacies,
  getPharmacyById,
};
