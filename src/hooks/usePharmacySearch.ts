/**
 * Pharmacy React Query hooks
 * Provides pharmacy search, nearby lookup, and detail fetching
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';
import {
  searchPharmacies,
  getNearbyPharmacies,
  getPharmacyById,
  type PharmacySearchParams,
} from '@/services/api/pharmacyApi';

/** Search pharmacies with filters */
export function usePharmacySearchQuery(params: PharmacySearchParams | null) {
  return useQuery({
    queryKey: queryKeys.pharmacies.search(params ?? {}),
    queryFn: () => searchPharmacies(params!),
    enabled: !!params?.zipCode,
    staleTime: 5 * 60 * 1000,
  });
}

/** Get nearby pharmacies by ZIP */
export function useNearbyPharmacies(
  zipCode: string,
  radius?: number,
  latitude?: number,
  longitude?: number,
) {
  return useQuery({
    queryKey: queryKeys.pharmacies.nearby(zipCode, radius),
    queryFn: () => getNearbyPharmacies(zipCode, radius, latitude, longitude),
    enabled: !!zipCode,
    staleTime: 5 * 60 * 1000,
  });
}

/** Get pharmacy detail by ID */
export function usePharmacyDetail(pharmacyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.pharmacies.detail(pharmacyId ?? ''),
    queryFn: () => getPharmacyById(pharmacyId!),
    enabled: !!pharmacyId,
    staleTime: 10 * 60 * 1000,
  });
}
