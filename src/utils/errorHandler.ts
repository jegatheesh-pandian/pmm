/**
 * Global error handling utilities
 * Extracts user-friendly messages from API errors, network errors, etc.
 */

import { AxiosError } from 'axios';
import type { ApiResponse } from '@/types/api';
import { logger } from '@/services/loggingService';

interface ParsedError {
  message: string;
  code?: string;
  status?: number;
}

const NETWORK_MESSAGES: Record<string, string> = {
  ERR_NETWORK: 'Unable to connect. Please check your internet connection.',
  ECONNABORTED: 'Request timed out. Please try again.',
  ERR_CANCELED: 'Request was cancelled.',
};

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'Session expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'A conflict occurred. Please try again.',
  422: 'Invalid data. Please check your input.',
  429: 'Too many requests. Please wait a moment.',
  500: 'Server error. Please try again later.',
  502: 'Service temporarily unavailable.',
  503: 'Service is under maintenance. Please try again later.',
};

export function parseApiError(error: unknown): ParsedError {
  if (error instanceof AxiosError) {
    // Network-level error (no response)
    if (!error.response) {
      const networkMsg = error.code ? NETWORK_MESSAGES[error.code] : null;
      return {
        message: networkMsg ?? 'Unable to connect. Please check your internet connection.',
        code: error.code,
      };
    }

    const status = error.response.status;
    const data = error.response.data as ApiResponse<unknown> | undefined;

    // Backend returned structured error
    if (data?.message) {
      return { message: data.message, code: data.errorCode, status };
    }

    // Fall back to status code message
    return {
      message: STATUS_MESSAGES[status] ?? `Unexpected error (${status}).`,
      status,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: 'An unexpected error occurred.' };
}

export function getErrorMessage(error: unknown): string {
  return parseApiError(error).message;
}

export function logAndGetError(context: string, error: unknown): string {
  const parsed = parseApiError(error);
  logger.error(context, parsed.message, { code: parsed.code, status: parsed.status });
  return parsed.message;
}
