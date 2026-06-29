/**
 * Account React Query hooks
 * User profile, saved medications, and account data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';
import {
  getUserProfile,
  getSavedMedications,
  saveMedication,
  updateMedication,
  deleteMedication,
} from '@/services/api/accountApi';
import { useAuthStore } from '@/store/authStore';
import type { SaveMedicationRequest, UpdateMedicationRequest } from '@/types/medication';

/** Get user profile (auth required) */
export function useUserProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: getUserProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

/** Get saved medications (auth required) */
export function useSavedMedications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.medications.all,
    queryFn: getSavedMedications,
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });
}

/** Save a medication mutation */
export function useSaveMedicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: SaveMedicationRequest) => saveMedication(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.medications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
    },
  });
}

/** Update a medication mutation */
export function useUpdateMedicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateMedicationRequest }) =>
      updateMedication(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.medications.all });
    },
  });
}

/** Delete a medication mutation */
export function useDeleteMedicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMedication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.medications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
    },
  });
}
