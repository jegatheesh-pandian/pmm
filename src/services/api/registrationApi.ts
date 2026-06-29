/**
 * General Registration API service
 * Matches Angular GeneralRegistrationService (285 LOC)
 * 9 endpoints for multi-step registration flow
 */

import apiClient from './apiClient';
import { ENDPOINTS } from '@/constants/api';
import type { ApiResponse, BackendAuthResponse } from '@/types/api';

export interface RegistrationStep1Data {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  dateOfBirth: string; // ISO format YYYY-MM-DD
  password: string;
  confirmPassword: string;
}

export interface RegistrationStep2Data {
  registrationId: string;
  hasInsurance: boolean;
  insuranceId?: string;
  dateOfBirth?: string;
  acceptedMarketing?: boolean;
}

export interface VerifyOtpData {
  registrationId: string;
  type: 'mobile' | 'email';
  code: string;
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  registrationId?: string;
  currentStep?: number;
  nextStep?: string;
  maskedMobile?: string;
  maskedEmail?: string;
  otpExpirySeconds?: number;
  insuranceVerified?: boolean;
  insuranceMessage?: string;
}

export interface RegistrationStatusResponse {
  registrationId: string;
  status: 'step1_complete' | 'step2_complete' | 'mobile_verified' | 'email_verified' | 'complete';
  mobileVerified: boolean;
  emailVerified: boolean;
}

export const registrationApi = {
  checkEmail(email: string) {
    return apiClient.get<ApiResponse<{ available: boolean; exists?: boolean }>>(
      `${ENDPOINTS.GENERAL_REG_CHECK_EMAIL}?email=${encodeURIComponent(email)}`,
    );
  },

  checkMobile(mobile: string) {
    return apiClient.get<ApiResponse<{ available: boolean; exists?: boolean }>>(
      `${ENDPOINTS.GENERAL_REG_CHECK_MOBILE}?mobile=${encodeURIComponent(mobile)}`,
    );
  },

  submitStep1(data: RegistrationStep1Data) {
    return apiClient.post<RegistrationResponse>(
      ENDPOINTS.GENERAL_REG_STEP1,
      data,
    );
  },

  submitStep2(data: RegistrationStep2Data) {
    return apiClient.post<RegistrationResponse>(
      ENDPOINTS.GENERAL_REG_STEP2,
      data,
    );
  },

  verifyInsurance(registrationId: string, insuranceId: string) {
    return apiClient.post<RegistrationResponse>(
      `${ENDPOINTS.GENERAL_REG_VERIFY_INSURANCE}?registrationId=${encodeURIComponent(registrationId)}&insuranceId=${encodeURIComponent(insuranceId)}`,
      {},
    );
  },

  verifyOtp(data: VerifyOtpData) {
    return apiClient.post<RegistrationResponse>(
      ENDPOINTS.GENERAL_REG_VERIFY_OTP,
      data,
    );
  },

  resendOtp(registrationId: string, type: 'mobile' | 'email') {
    return apiClient.post<RegistrationResponse>(
      `${ENDPOINTS.GENERAL_REG_RESEND_OTP}?registrationId=${encodeURIComponent(registrationId)}&type=${type}`,
      {},
    );
  },

  complete(registrationId: string) {
    return apiClient.post<ApiResponse<BackendAuthResponse>>(
      `${ENDPOINTS.GENERAL_REG_COMPLETE}?registrationId=${encodeURIComponent(registrationId)}`,
      {},
    );
  },

  getStatus(registrationId: string) {
    return apiClient.get<ApiResponse<RegistrationStatusResponse>>(
      `${ENDPOINTS.GENERAL_REG_STATUS}?registrationId=${encodeURIComponent(registrationId)}`,
    );
  },
};
