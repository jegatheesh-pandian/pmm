/**
 * Account API service
 * Ported from Angular user/account API services
 * Handles user profile, medications, alerts, history, family
 */

import apiClient from './apiClient';
import { ENDPOINTS } from '@/constants/api';
import type { ApiResponse } from '@/types/api';
import type { User, NotificationPreferences } from '@/types/user';
import type {
  SavedMedicationResponse,
  SaveMedicationRequest,
  UpdateMedicationRequest,
} from '@/types/medication';

/**
 * Backend wraps every response in an { success, data, message } envelope.
 * Unwrap it to the inner payload (mirrors the web ApiService.handleResponse).
 */
function unwrap<T>(body: ApiResponse<T> | T): T {
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    const env = body as ApiResponse<T>;
    if (!env.success) {
      throw new Error(env.message || 'API request failed');
    }
    return env.data;
  }
  return body as T;
}

// ── User Profile ────────────────────────────────────────────────────

export async function getUserProfile(): Promise<User> {
  const { data } = await apiClient.get<ApiResponse<User>>(ENDPOINTS.USER_ME);
  return unwrap(data);
}

export async function updateProfile(updates: {
  lastName?: string;
  smsConsent?: boolean;
  defaultZipCode?: string;
  preferredPharmacyId?: string;
}): Promise<User> {
  const { data } = await apiClient.patch<ApiResponse<User>>(ENDPOINTS.USER_ME, updates);
  return unwrap(data);
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string }> {
  const { data } = await apiClient.post(ENDPOINTS.USER_CHANGE_PASSWORD, payload);
  return data;
}

export async function changeEmail(newEmail: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.post(ENDPOINTS.USER_EMAIL, { email: newEmail });
  return data;
}

export async function verifyEmailChange(otp: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.post(ENDPOINTS.USER_EMAIL_VERIFY, { otp });
  return data;
}

export async function sendOtp(channel: 'email' | 'sms'): Promise<{ success: boolean }> {
  const { data } = await apiClient.post(ENDPOINTS.USER_SEND_OTP, { channel });
  return data;
}

export async function verifyOtp(
  channel: 'email' | 'sms',
  otp: string,
): Promise<{ success: boolean }> {
  const { data } = await apiClient.post(ENDPOINTS.USER_VERIFY_OTP, { channel, otp });
  return data;
}

export async function deleteAccount(): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(ENDPOINTS.USER_DELETE);
  return data;
}

export async function requestDataExport(): Promise<{ success: boolean; message: string }> {
  const { data } = await apiClient.post(ENDPOINTS.USER_EXPORT);
  return data;
}

// ── Notifications ───────────────────────────────────────────────────

export async function updateNotificationPreferences(
  prefs: NotificationPreferences,
): Promise<NotificationPreferences> {
  const { data } = await apiClient.put<NotificationPreferences>(
    `${ENDPOINTS.USER_ME}/notifications`,
    prefs,
  );
  return data;
}

// ── Medications ─────────────────────────────────────────────────────

export async function getSavedMedications(): Promise<SavedMedicationResponse[]> {
  const { data } = await apiClient.get<ApiResponse<SavedMedicationResponse[]>>(
    ENDPOINTS.MEDICATIONS,
  );
  return unwrap(data) ?? [];
}

export async function saveMedication(
  request: SaveMedicationRequest,
): Promise<SavedMedicationResponse> {
  const { data } = await apiClient.post<ApiResponse<SavedMedicationResponse>>(
    ENDPOINTS.MEDICATIONS,
    request,
  );
  return unwrap(data);
}

export async function updateMedication(
  id: string,
  request: UpdateMedicationRequest,
): Promise<SavedMedicationResponse> {
  const { data } = await apiClient.put<ApiResponse<SavedMedicationResponse>>(
    `${ENDPOINTS.MEDICATIONS}/${id}`,
    request,
  );
  return unwrap(data);
}

export async function deleteMedication(id: string): Promise<void> {
  await apiClient.delete(`${ENDPOINTS.MEDICATIONS}/${id}`);
}

export async function checkMedicationSaved(
  medispanId: number,
): Promise<{ saved: boolean; medItemId?: string }> {
  const { data } = await apiClient.get(
    `${ENDPOINTS.MEDICATIONS_CHECK}/${medispanId}`,
  );
  return data;
}

export const accountApi = {
  getUserProfile,
  updateProfile,
  changePassword,
  changeEmail,
  verifyEmailChange,
  sendOtp,
  verifyOtp,
  deleteAccount,
  requestDataExport,
  updateNotificationPreferences,
  getSavedMedications,
  saveMedication,
  updateMedication,
  deleteMedication,
  checkMedicationSaved,
};
