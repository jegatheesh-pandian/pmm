/**
 * Auth API service
 * Ported from Angular AuthService API calls
 */

import apiClient from './apiClient';
import { ENDPOINTS } from '@/constants/api';
import type { ApiResponse, BackendAuthResponse } from '@/types/api';

export const authApi = {
  login(mobile: string, password: string) {
    return apiClient.post<ApiResponse<BackendAuthResponse>>(ENDPOINTS.AUTH_LOGIN, {
      mobile,
      password,
    });
  },

  register(data: {
    mobile: string;
    password: string;
    firstName?: string;
    lastName?: string;
    emailId: string;
  }) {
    return apiClient.post<ApiResponse<BackendAuthResponse>>(ENDPOINTS.AUTH_REGISTER, data);
  },

  refreshToken(refreshToken: string) {
    return apiClient.post<ApiResponse<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }>>(ENDPOINTS.AUTH_REFRESH_TOKEN, { refreshToken });
  },

  sendOtp(mobile: string) {
    return apiClient.post<ApiResponse<unknown>>(
      `${ENDPOINTS.AUTH_SEND_OTP}?mobile=${encodeURIComponent(mobile)}`,
      {}
    );
  },

  verifyOtp(mobile: string, code: string) {
    return apiClient.post<ApiResponse<boolean>>(ENDPOINTS.AUTH_VERIFY_OTP, {
      mobile,
      code,
    });
  },

  updateProfile(data: {
    lastName?: string;
    emailId?: string;
    mobile?: string;
    smsNotificationIsEnabled?: 'TRUE' | 'FALSE';
  }) {
    return apiClient.post<ApiResponse<unknown>>(ENDPOINTS.USER_ME, data);
  },

  changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
    return apiClient.post<ApiResponse<boolean>>(ENDPOINTS.USER_CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  },

  sendEmailOtp(newEmail: string) {
    return apiClient.post<ApiResponse<unknown>>(
      `${ENDPOINTS.USER_EMAIL}?newEmail=${encodeURIComponent(newEmail)}`,
      {}
    );
  },

  verifyEmailOtp(otp: string) {
    return apiClient.post<ApiResponse<boolean>>(
      `${ENDPOINTS.USER_EMAIL_VERIFY}?otp=${encodeURIComponent(otp)}`,
      {}
    );
  },
};
