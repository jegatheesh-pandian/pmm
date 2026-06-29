/**
 * Coupon Store (Zustand)
 * Manages saved coupons and coupon history
 * Persisted to AsyncStorage
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_COUPONS_KEY = 'pmm_saved_coupons';
const MAX_SAVED = 50;

export interface SavedCoupon {
  id: string;
  drugName: string;
  genericName?: string;
  form: string;
  dosage: string;
  quantity: number;
  pharmacyName: string;
  pharmacyChain: string;
  pharmacyAddress: string;
  pharmacyPhone: string;
  discountPrice: number;
  retailPrice: number;
  savingsAmount: number;
  savingsPercent: number;
  bin: string;
  pcn: string;
  group: string;
  memberId: string;
  apiSource?: string;
  savedAt: number;
}

interface CouponState {
  savedCoupons: SavedCoupon[];
  saveCoupon: (coupon: Omit<SavedCoupon, 'id' | 'savedAt'>) => void;
  removeCoupon: (id: string) => void;
  clearCoupons: () => void;
  isCouponSaved: (drugName: string, pharmacyName: string) => boolean;
  restoreCoupons: () => Promise<void>;
}

function generateId(): string {
  return `cpn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useCouponStore = create<CouponState>((set, get) => ({
  savedCoupons: [],

  saveCoupon: (coupon) => {
    const existing = get().savedCoupons;
    // Prevent duplicate: same drug + same pharmacy
    const duplicate = existing.find(
      (c) => c.drugName === coupon.drugName && c.pharmacyName === coupon.pharmacyName,
    );
    let updated: SavedCoupon[];
    if (duplicate) {
      // Update existing
      updated = existing.map((c) =>
        c.id === duplicate.id
          ? { ...coupon, id: c.id, savedAt: Date.now() }
          : c,
      );
    } else {
      updated = [{ ...coupon, id: generateId(), savedAt: Date.now() }, ...existing].slice(
        0,
        MAX_SAVED,
      );
    }
    set({ savedCoupons: updated });
    AsyncStorage.setItem(SAVED_COUPONS_KEY, JSON.stringify(updated));
  },

  removeCoupon: (id) => {
    const updated = get().savedCoupons.filter((c) => c.id !== id);
    set({ savedCoupons: updated });
    AsyncStorage.setItem(SAVED_COUPONS_KEY, JSON.stringify(updated));
  },

  clearCoupons: () => {
    set({ savedCoupons: [] });
    AsyncStorage.removeItem(SAVED_COUPONS_KEY);
  },

  isCouponSaved: (drugName, pharmacyName) => {
    return get().savedCoupons.some(
      (c) => c.drugName === drugName && c.pharmacyName === pharmacyName,
    );
  },

  restoreCoupons: async () => {
    try {
      const raw = await AsyncStorage.getItem(SAVED_COUPONS_KEY);
      if (raw) {
        set({ savedCoupons: JSON.parse(raw) });
      }
    } catch {
      // Use empty
    }
  },
}));
