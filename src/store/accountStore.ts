/**
 * Account Store (Zustand)
 * Manages saved medications and account-related data
 */

import { create } from 'zustand';
import type { SavedMedicationResponse } from '@/types/medication';

interface AccountState {
  medications: SavedMedicationResponse[];
  isLoadingMedications: boolean;

  setMedications: (meds: SavedMedicationResponse[]) => void;
  addMedication: (med: SavedMedicationResponse) => void;
  updateMedication: (id: string, updates: Partial<SavedMedicationResponse>) => void;
  removeMedication: (id: string) => void;
  setLoadingMedications: (loading: boolean) => void;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  medications: [],
  isLoadingMedications: false,

  setMedications: (meds) => set({ medications: meds }),

  addMedication: (med) =>
    set({ medications: [...get().medications, med] }),

  updateMedication: (id, updates) =>
    set({
      medications: get().medications.map((m) =>
        m.medItemId === id ? { ...m, ...updates } : m
      ),
    }),

  removeMedication: (id) =>
    set({
      medications: get().medications.filter((m) => m.medItemId !== id),
    }),

  setLoadingMedications: (loading) => set({ isLoadingMedications: loading }),
}));
