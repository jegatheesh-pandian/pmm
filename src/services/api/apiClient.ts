/**
 * Axios API Client with JWT interceptors
 * Ported from Angular auth.interceptor.ts (256 lines)
 *
 * Token lifecycle:
 * - Access token: short-lived (15-60 min from backend)
 * - Refresh token: 7-day validity, extended on each refresh
 * - Proactive refresh: 10s before access token expiry
 * - On 401: attempt refresh, retry original request
 * - On 403: clear auth, redirect to login
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import { API_BASE_URL, AUTH_WHITELIST, TOKEN_CONFIG, ENDPOINTS } from '@/constants/api';
import { SECURE_KEYS } from '@/constants/storage';
import { getSecureItem, setSecureItem, removeSecureItem } from '@/utils/secureStorage';
import type { StoredAuthData, ApiResponse } from '@/types/api';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  failedQueue = [];
}

/** Check if access token is expired or within 10s buffer */
function isAccessTokenExpired(authData: StoredAuthData): boolean {
  if (!authData.expiresAt) return true;
  return new Date(authData.expiresAt).getTime() <= Date.now() + TOKEN_CONFIG.ACCESS_TOKEN_BUFFER_MS;
}

/** Check if refresh token has expired (7-day window) */
function isRefreshTokenExpired(authData: StoredAuthData): boolean {
  if (!authData.refreshTokenExpiresAt) return true;
  return new Date(authData.refreshTokenExpiresAt).getTime() <= Date.now();
}

/** Refresh the access token */
async function refreshAccessToken(currentRefreshToken: string): Promise<string | null> {
  try {
    const response = await axios.post<ApiResponse<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }>>(`${API_BASE_URL}${ENDPOINTS.AUTH_REFRESH_TOKEN}`, {
      refreshToken: currentRefreshToken,
    });

    if (response.data.success && response.data.data) {
      const { accessToken, refreshToken, expiresIn } = response.data.data;

      const accessTokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
      const refreshTokenExpiresAt = new Date(
        Date.now() + TOKEN_CONFIG.REFRESH_TOKEN_VALIDITY_DAYS * 24 * 60 * 60 * 1000
      ).toISOString();

      const existingAuth = await getSecureItem<StoredAuthData>(SECURE_KEYS.AUTH_TOKENS);

      await setSecureItem<StoredAuthData>(SECURE_KEYS.AUTH_TOKENS, {
        token: accessToken,
        refreshToken,
        expiresAt: accessTokenExpiresAt,
        refreshTokenExpiresAt,
        rememberMe: existingAuth?.rememberMe ?? false,
      });

      return accessToken;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }
  return null;
}

/** Clear auth data */
async function clearAuth() {
  await removeSecureItem(SECURE_KEYS.AUTH_TOKENS);
  await removeSecureItem(SECURE_KEYS.USER_DATA);
}

// ─── Create Axios Instance ────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Skip auth for whitelisted endpoints
  const isWhitelisted = AUTH_WHITELIST.some((ep) => config.url?.includes(ep));
  if (isWhitelisted) return config;

  const authData = await getSecureItem<StoredAuthData>(SECURE_KEYS.AUTH_TOKENS);
  if (!authData?.token) return config;

  // Check refresh token expiry (7 days)
  if (isRefreshTokenExpired(authData)) {
    await clearAuth();
    return config;
  }

  // Proactive refresh: if access token expired/expiring, refresh first
  if (isAccessTokenExpired(authData) && !isRefreshing) {
    isRefreshing = true;
    try {
      const newToken = await refreshAccessToken(authData.refreshToken);
      isRefreshing = false;
      processQueue(null, newToken);

      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
      } else {
        await clearAuth();
      }
    } catch (error) {
      isRefreshing = false;
      processQueue(error, null);
      await clearAuth();
    }
    return config;
  }

  // If currently refreshing, queue this request
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({
        resolve: (token: string) => {
          config.headers.Authorization = `Bearer ${token}`;
          resolve(config);
        },
        reject: (err: unknown) => {
          reject(err);
        },
      });
    });
  }

  // Normal case: attach existing token
  config.headers.Authorization = `Bearer ${authData.token}`;
  return config;
});

// ─── Response Interceptor ─────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401: attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      const authData = await getSecureItem<StoredAuthData>(SECURE_KEYS.AUTH_TOKENS);
      if (!authData?.refreshToken) {
        isRefreshing = false;
        await clearAuth();
        router.replace('/(auth)/login');
        return Promise.reject(error);
      }

      const newToken = await refreshAccessToken(authData.refreshToken);
      isRefreshing = false;

      if (newToken) {
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } else {
        processQueue(error, null);
        await clearAuth();
        router.replace('/(auth)/login');
        return Promise.reject(error);
      }
    }

    // Handle 403: session invalid
    if (error.response?.status === 403) {
      await clearAuth();
      router.replace('/(auth)/login');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
