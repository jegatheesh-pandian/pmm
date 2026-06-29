/**
 * Medication API Service
 * Ported from Angular MedicationService
 * CRUD for user's saved medications
 */

import apiClient from './apiClient';
import { ENDPOINTS } from '@/constants/api';
import type { ApiResponse } from '@/types/api';
import type {
  SavedMedicationResponse,
  SaveMedicationRequest,
  UpdateMedicationRequest,
} from '@/types/medication';

export const medicationApi = {
  getSavedMedications() {
    return apiClient.get<ApiResponse<SavedMedicationResponse[]>>(ENDPOINTS.MEDICATIONS);
  },

  saveMedication(data: SaveMedicationRequest) {
    return apiClient.post<ApiResponse<SavedMedicationResponse>>(ENDPOINTS.MEDICATIONS, data);
  },

  updateMedication(medItemId: string, data: UpdateMedicationRequest) {
    return apiClient.put<ApiResponse<SavedMedicationResponse>>(
      `${ENDPOINTS.MEDICATIONS}/${medItemId}`,
      data,
    );
  },

  deleteMedication(medItemId: string) {
    return apiClient.delete<ApiResponse<void>>(`${ENDPOINTS.MEDICATIONS}/${medItemId}`);
  },

  checkMedicationSaved(drugInformationMedispanId: number) {
    return apiClient.get<ApiResponse<boolean>>(
      `${ENDPOINTS.MEDICATIONS_CHECK}/${drugInformationMedispanId}`,
    );
  },
};
