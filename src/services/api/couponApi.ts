/**
 * Coupon API service
 * Ported from Angular CouponApiService
 * Handles coupon email/SMS delivery and lead capture
 */

import apiClient from './apiClient';
import { ENDPOINTS } from '@/constants/api';
import { COUPON_DEFAULTS } from '@/constants/pharmacy';
import type {
  SendCouponRequest,
  CouponLeadRequest,
  CouponLeadResponse,
  CouponSourceType,
} from '@/types/coupon';
import type { PharmacyPrice } from '@/types/pharmacy';

// ── Response Types ──────────────────────────────────────────────────

interface SendCouponResponse {
  success: boolean;
  message: string;
}

interface CaptureResponse {
  success: boolean;
  data?: CouponLeadResponse;
}

// ── Coupon Data (passed from drug pricing) ──────────────────────────

export interface CouponData {
  drugName: string;
  genericName?: string;
  form: string;
  dosage: string;
  quantity: number;
  pharmacyPrice: PharmacyPrice;
}

// ── Helper: Build API request from coupon data ──────────────────────

export function buildSendRequest(
  couponData: CouponData,
  options?: { email?: string; mobile?: string },
): SendCouponRequest {
  const { drugName, form, dosage, quantity, pharmacyPrice } = couponData;

  return {
    email: options?.email,
    mobile: options?.mobile,
    type: (pharmacyPrice.apiSource as CouponSourceType) || 'CPX',
    displayBrand: drugName,
    displayForm: form,
    displayDosage: dosage,
    displayQuantity: String(quantity),
    amount: pharmacyPrice.discountPrice.toFixed(2),
    pharmacyName: pharmacyPrice.pharmacy.name,
    pharmacyAddress: [
      pharmacyPrice.pharmacy.address.street,
      pharmacyPrice.pharmacy.address.city,
      pharmacyPrice.pharmacy.address.state,
      pharmacyPrice.pharmacy.address.zipCode,
    ]
      .filter(Boolean)
      .join(', '),
    bin: pharmacyPrice.bin || COUPON_DEFAULTS.BIN,
    pcn: pharmacyPrice.pcn || COUPON_DEFAULTS.PCN,
    groupId: pharmacyPrice.group || COUPON_DEFAULTS.GROUP_ID,
    memberId: pharmacyPrice.memberId || COUPON_DEFAULTS.MEMBER_ID,
    retailPrice: pharmacyPrice.retailPrice?.toFixed(2),
  };
}

// ── API Functions ───────────────────────────────────────────────────

/** Send coupon via email */
export async function sendCouponEmail(
  request: SendCouponRequest,
): Promise<SendCouponResponse> {
  const { data } = await apiClient.post<SendCouponResponse>(
    ENDPOINTS.COUPONS_SEND_EMAIL,
    request,
  );
  return data;
}

/** Send coupon via SMS */
export async function sendCouponSms(
  request: SendCouponRequest,
): Promise<SendCouponResponse> {
  const { data } = await apiClient.post<SendCouponResponse>(
    ENDPOINTS.COUPONS_SEND_SMS,
    request,
  );
  return data;
}

/** Capture coupon lead for CRM (fire-and-forget) */
export async function captureCouponLead(
  request: CouponLeadRequest,
): Promise<CaptureResponse> {
  try {
    const { data } = await apiClient.post<CaptureResponse>(
      ENDPOINTS.COUPONS_CAPTURE,
      request,
    );
    return data;
  } catch {
    // Silent failure - lead capture should never block user flow
    return { success: false };
  }
}

export const couponApi = {
  sendCouponEmail,
  sendCouponSms,
  captureCouponLead,
  buildSendRequest,
};
