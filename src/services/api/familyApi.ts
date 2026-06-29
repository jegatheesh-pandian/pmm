/**
 * Family API service
 * CRUD for family members and per-member medication tracking
 */

import apiClient from './apiClient';
import { ENDPOINTS } from '@/constants/api';
import type { FamilyMember, SavedMedication } from '@/types/user';

const FAMILY_BASE = `${ENDPOINTS.USER_ME}/family`;

// ── Request Types ───────────────────────────────────────────────────

export interface AddFamilyMemberRequest {
  firstName: string;
  lastName: string;
  relationship: 'spouse' | 'child' | 'parent' | 'other';
  dateOfBirth?: string;
  avatarColor?: string;
}

export interface UpdateFamilyMemberRequest {
  firstName?: string;
  lastName?: string;
  relationship?: 'spouse' | 'child' | 'parent' | 'other';
  dateOfBirth?: string;
  avatarColor?: string;
}

export interface AddFamilyMedicationRequest {
  drugInformationMedispanId: number;
  drugName: string;
  genericName?: string;
  form: string;
  dosage: string;
  quantity: number;
  ndc?: string;
  seoUrlName?: string;
  preferredPharmacyId?: string;
  preferredPharmacyName?: string;
  currentBestPrice?: number;
  retailPrice?: number;
}

// ── API Functions ───────────────────────────────────────────────────

/** Get all family members */
export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const { data } = await apiClient.get<FamilyMember[]>(FAMILY_BASE);
  return data;
}

/** Get single family member by ID */
export async function getFamilyMember(memberId: string): Promise<FamilyMember> {
  const { data } = await apiClient.get<FamilyMember>(`${FAMILY_BASE}/${memberId}`);
  return data;
}

/** Add a family member */
export async function addFamilyMember(
  request: AddFamilyMemberRequest,
): Promise<FamilyMember> {
  const { data } = await apiClient.post<FamilyMember>(FAMILY_BASE, request);
  return data;
}

/** Update a family member */
export async function updateFamilyMember(
  memberId: string,
  request: UpdateFamilyMemberRequest,
): Promise<FamilyMember> {
  const { data } = await apiClient.put<FamilyMember>(
    `${FAMILY_BASE}/${memberId}`,
    request,
  );
  return data;
}

/** Delete a family member */
export async function deleteFamilyMember(memberId: string): Promise<void> {
  await apiClient.delete(`${FAMILY_BASE}/${memberId}`);
}

/** Add a medication to a family member */
export async function addFamilyMedication(
  memberId: string,
  request: AddFamilyMedicationRequest,
): Promise<SavedMedication> {
  const { data } = await apiClient.post<SavedMedication>(
    `${FAMILY_BASE}/${memberId}/medications`,
    request,
  );
  return data;
}

/** Remove a medication from a family member */
export async function removeFamilyMedication(
  memberId: string,
  medicationId: string,
): Promise<void> {
  await apiClient.delete(`${FAMILY_BASE}/${memberId}/medications/${medicationId}`);
}

export const familyApi = {
  getFamilyMembers,
  getFamilyMember,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  addFamilyMedication,
  removeFamilyMedication,
};
