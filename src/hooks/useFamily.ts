/**
 * Family React Query hooks
 * Family member CRUD and per-member medication management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';
import {
  getFamilyMembers,
  getFamilyMember,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  addFamilyMedication,
  removeFamilyMedication,
  type AddFamilyMemberRequest,
  type UpdateFamilyMemberRequest,
  type AddFamilyMedicationRequest,
} from '@/services/api/familyApi';
import { useAuthStore } from '@/store/authStore';

const familyKeys = {
  all: ['family'] as const,
  list: () => ['family', 'list'] as const,
  detail: (id: string) => ['family', 'detail', id] as const,
};

/** Get all family members */
export function useFamilyMembers() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: familyKeys.list(),
    queryFn: getFamilyMembers,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

/** Get single family member */
export function useFamilyMember(memberId: string | undefined) {
  return useQuery({
    queryKey: familyKeys.detail(memberId ?? ''),
    queryFn: () => getFamilyMember(memberId!),
    enabled: !!memberId,
    staleTime: 5 * 60 * 1000,
  });
}

/** Add family member mutation */
export function useAddFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: AddFamilyMemberRequest) => addFamilyMember(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
    },
  });
}

/** Update family member mutation */
export function useUpdateFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateFamilyMemberRequest }) =>
      updateFamilyMember(id, request),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: familyKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: familyKeys.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
    },
  });
}

/** Delete family member mutation */
export function useDeleteFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFamilyMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
    },
  });
}

/** Add medication to family member */
export function useAddFamilyMedication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, request }: { memberId: string; request: AddFamilyMedicationRequest }) =>
      addFamilyMedication(memberId, request),
    onSuccess: (_, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: familyKeys.detail(memberId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.list() });
    },
  });
}

/** Remove medication from family member */
export function useRemoveFamilyMedication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, medicationId }: { memberId: string; medicationId: string }) =>
      removeFamilyMedication(memberId, medicationId),
    onSuccess: (_, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: familyKeys.detail(memberId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.list() });
    },
  });
}
