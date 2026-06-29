/**
 * Drug Store (Zustand)
 * Manages drug search state, search history, and favorites
 * Price/config data lives in React Query cache.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DrugSuggestion } from '@/types/drug';

const HISTORY_KEY = 'pmm_search_history';
const FAVORITES_KEY = 'pmm_favorite_drugs';
const MAX_HISTORY = 20;

interface SearchHistoryItem {
  slug: string;
  name: string;
  timestamp: number;
}

interface FavoriteDrug {
  slug: string;
  name: string;
  genericName: string;
  type: 'generic' | 'brand';
}

interface DrugState {
  // Search
  searchQuery: string;
  suggestions: DrugSuggestion[];
  isSearching: boolean;
  selectedLetter: string;

  // History & Favorites
  searchHistory: SearchHistoryItem[];
  favorites: FavoriteDrug[];

  // Search actions
  setSearchQuery: (query: string) => void;
  setSuggestions: (suggestions: DrugSuggestion[]) => void;
  setIsSearching: (searching: boolean) => void;
  setSelectedLetter: (letter: string) => void;
  clearSearch: () => void;

  // History actions
  addToHistory: (slug: string, name: string) => void;
  removeFromHistory: (slug: string) => void;
  clearHistory: () => void;
  restoreHistory: () => Promise<void>;

  // Favorites actions
  addFavorite: (drug: FavoriteDrug) => void;
  removeFavorite: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
  restoreFavorites: () => Promise<void>;
}

export const useDrugStore = create<DrugState>((set, get) => ({
  searchQuery: '',
  suggestions: [],
  isSearching: false,
  selectedLetter: 'A',
  searchHistory: [],
  favorites: [],

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setIsSearching: (searching) => set({ isSearching: searching }),
  setSelectedLetter: (letter) => set({ selectedLetter: letter }),
  clearSearch: () => set({ searchQuery: '', suggestions: [], isSearching: false }),

  // ─── History ──────────────────────────────────────────────────

  addToHistory: (slug, name) => {
    const current = get().searchHistory.filter((h) => h.slug !== slug);
    const updated = [{ slug, name, timestamp: Date.now() }, ...current].slice(0, MAX_HISTORY);
    set({ searchHistory: updated });
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  },

  removeFromHistory: (slug) => {
    const updated = get().searchHistory.filter((h) => h.slug !== slug);
    set({ searchHistory: updated });
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  },

  clearHistory: () => {
    set({ searchHistory: [] });
    AsyncStorage.removeItem(HISTORY_KEY);
  },

  restoreHistory: async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (raw) set({ searchHistory: JSON.parse(raw) });
    } catch {
      // Use empty history
    }
  },

  // ─── Favorites ────────────────────────────────────────────────

  addFavorite: (drug) => {
    const current = get().favorites.filter((f) => f.slug !== drug.slug);
    const updated = [drug, ...current];
    set({ favorites: updated });
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  },

  removeFavorite: (slug) => {
    const updated = get().favorites.filter((f) => f.slug !== slug);
    set({ favorites: updated });
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  },

  isFavorite: (slug) => get().favorites.some((f) => f.slug === slug),

  restoreFavorites: async () => {
    try {
      const raw = await AsyncStorage.getItem(FAVORITES_KEY);
      if (raw) set({ favorites: JSON.parse(raw) });
    } catch {
      // Use empty favorites
    }
  },
}));
