/**
 * Coupon types - ported from Angular coupon.model.ts
 */

export type CouponDeliveryMethod = 'print' | 'email' | 'sms';
export type CouponStatus = 'active' | 'used' | 'expired';
export type CouponSourceType = 'CPX' | 'SC' | 'NV' | 'ELX' | 'SS' | 'HIPPO';

export interface SendCouponRequest {
  email?: string;
  mobile?: string;
  type: CouponSourceType;
  displayBrand: string;
  displayForm: string;
  displayDosage: string;
  displayQuantity: string;
  amount: string;
  pharmacyName?: string;
  pharmacyAddress?: string;
  bin?: string;
  pcn?: string;
  groupId?: string;
  memberId?: string;
  retailPrice?: string;
}

export interface CouponLeadRequest {
  email?: string;
  phone?: string;
  couponDrugName?: string;
  couponSourcePage?: string;
  deliveryMethod?: 'email' | 'text' | 'print';
  marketingEmailConsent?: boolean;
  smsConsent?: boolean;
}

export interface CouponLeadResponse {
  leadId: string;
  email?: string;
  phone?: string;
  couponDrugName?: string;
  couponRequested: boolean;
  hubspotSynced: boolean;
}
