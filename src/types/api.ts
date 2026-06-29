/**
 * API response types
 * Matches Spring Boot backend envelope format
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
  errorCode?: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ApiError {
  status: number;
  message: string;
  errorCode?: string;
}

/** Backend auth response shape */
export interface BackendAuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  gbhUser: {
    gbhUserId: string;
    firstName: string;
    lastName: string;
    emailId: string;
    mobile: string;
    totalSavings: number;
    gbhStatus: string;
  };
}

/** Token data stored in SecureStore */
export interface StoredAuthData {
  token: string;
  refreshToken: string;
  expiresAt: string;
  refreshTokenExpiresAt: string;
  rememberMe: boolean;
}
