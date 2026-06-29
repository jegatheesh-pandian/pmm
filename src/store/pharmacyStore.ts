/**
 * Pharmacy Store (Zustand)
 * Manages pharmacy search filters, sort preferences, and recently viewed pharmacies
 * Actual pharmacy data lives in React Query cache
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PharmacyPriceSortOption, PharmacyPriceFilters } from '@/types/pharmacy';

const RECENT_PHARMACIES_KEY = 'pmm_recent_pharmacies';
const MAX_RECENT = 10;

interface RecentPharmacy {
  id: string;
  name: string;
  chain: string;
  city: string;
  state: string;
  viewedAt: number;
}

interface PharmacyState {
  sortOption: PharmacyPriceSortOption;
  filters: PharmacyPriceFilters;
  recentPharmacies: RecentPharmacy[];

  setSortOption: (option: PharmacyPriceSortOption) => void;
  setFilters: (filters: PharmacyPriceFilters) => void;
  resetFilters: () => void;
  addRecentPharmacy: (pharmacy: Omit<RecentPharmacy, 'viewedAt'>) => void;
  restoreRecentPharmacies: () => Promise<void>;
}

export const usePharmacyStore = create<PharmacyState>((set, get) => ({
  sortOption: 'distance-asc',
  filters: {},
  recentPharmacies: [],

  setSortOption: (option) => set({ sortOption: option }),
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: {}, sortOption: 'distance-asc' }),

  addRecentPharmacy: (pharmacy) => {
    const existing = get().recentPharmacies.filter((p) => p.id !== pharmacy.id);
    const updated = [{ ...pharmacy, viewedAt: Date.now() }, ...existing].slice(0, MAX_RECENT);
    set({ recentPharmacies: updated });
    AsyncStorage.setItem(RECENT_PHARMACIES_KEY, JSON.stringify(updated));
  },

  restoreRecentPharmacies: async () => {
    try {
      const raw = await AsyncStorage.getItem(RECENT_PHARMACIES_KEY);
      if (raw) {
        set({ recentPharmacies: JSON.parse(raw) });
      }
    } catch {
      // Use empty
    }
  },
}));
