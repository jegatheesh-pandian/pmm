/**
 * useDrugPrices - React Query hooks for drug config, prices, alternatives
 * Ported from Angular DrugPricingComponent signal-based fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';
import { drugApi } from '@/services/api/drugApi';
import { medicationApi } from '@/services/api/medicationApi';
import type { SaveMedicationRequest } from '@/types/medication';

export function useDrugConfig(slug: string) {
  return useQuery({
    queryKey: queryKeys.drugs.config(slug),
    queryFn: () => drugApi.getDrugConfig(slug),
    enabled: !!slug,
    staleTime: 10 * 60_000,
  });
}

export function useDrugPrices(params: {
  name: string;
  form: string;
  dosage: string;
  quantity: string | number;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}) {
  const hasRequiredParams = !!(params.name && params.form && params.dosage && params.quantity && params.zipCode);

  return useQuery({
    queryKey: queryKeys.drugs.prices(params.name, params),
    queryFn: () => drugApi.getDrugPrices(params),
    enabled: hasRequiredParams,
    staleTime: 2 * 60_000,
  });
}

export function useDrugDescription(ndc: string | undefined) {
  return useQuery({
    queryKey: queryKeys.drugs.description(ndc ?? ''),
    queryFn: () => drugApi.getDrugDescription(ndc!),
    enabled: !!ndc,
    staleTime: 30 * 60_000,
  });
}

export function useDrugAlternatives(seoUrlName: string | undefined) {
  return useQuery({
    queryKey: queryKeys.drugs.alternatives(seoUrlName ?? ''),
    queryFn: () => drugApi.getDrugAlternatives(seoUrlName!),
    enabled: !!seoUrlName,
    staleTime: 10 * 60_000,
  });
}

export function useCheckMedicationSaved(medispanId: number | null) {
  return useQuery({
    queryKey: queryKeys.medications.check(medispanId ?? 0),
    queryFn: async () => {
      const res = await medicationApi.checkMedicationSaved(medispanId!);
      return res.data.data ?? false;
    },
    enabled: !!medispanId && medispanId > 0,
    staleTime: 60_000,
  });
}

export function useSaveMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaveMedicationRequest) => medicationApi.saveMedication(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.medications.all });
    },
  });
}
