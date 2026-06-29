/**
 * Settings Store (Zustand)
 * Manages location, ZIP code, theme, privacy preferences, and app settings
 * Ported from Angular LocationService + SettingsService signals
 */

import { create } from 'zustand';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/storage';
import { DEFAULT_LOCATION } from '@/constants/pharmacy';

type ThemeMode = 'light' | 'dark' | 'system';
type LocationSource = 'default' | 'gps' | 'manual';
type LocationPermission = 'pending' | 'granted' | 'denied';

interface SettingsState {
  // Location
  zipCode: string;
  latitude: number;
  longitude: number;
  city: string;
  stateCode: string;
  locationSource: LocationSource;
  locationPermission: LocationPermission;
  isLoadingLocation: boolean;

  // Theme
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';

  // Privacy / Data
  analyticsEnabled: boolean;
  crashReportingEnabled: boolean;

  // Location actions
  setZipCode: (zipCode: string, city?: string, stateCode?: string) => void;
  setGpsLocation: (lat: number, lng: number, zip: string, city: string, state: string) => void;
  setPermission: (permission: LocationPermission) => void;
  setLoadingLocation: (loading: boolean) => void;
  resetToDefault: () => void;
  restoreZipCode: () => Promise<void>;

  // Theme actions
  setThemeMode: (mode: ThemeMode) => void;
  restoreTheme: () => Promise<void>;

  // Privacy actions
  setAnalyticsEnabled: (enabled: boolean) => void;
  setCrashReportingEnabled: (enabled: boolean) => void;
  restorePrivacyPrefs: () => Promise<void>;
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  }
  return mode;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Location defaults
  zipCode: DEFAULT_LOCATION.zipCode,
  latitude: DEFAULT_LOCATION.latitude,
  longitude: DEFAULT_LOCATION.longitude,
  city: DEFAULT_LOCATION.city,
  stateCode: DEFAULT_LOCATION.stateCode,
  locationSource: 'default',
  locationPermission: 'pending',
  isLoadingLocation: false,

  // Theme defaults
  themeMode: 'system',
  resolvedTheme: resolveTheme('system'),

  // Privacy defaults
  analyticsEnabled: true,
  crashReportingEnabled: true,

  setZipCode: (zipCode, city, stateCode) => {
    set({
      zipCode,
      city: city ?? '',
      stateCode: stateCode ?? '',
      locationSource: 'manual',
    });
    AsyncStorage.setItem(
      STORAGE_KEYS.USER_ZIPCODE,
      JSON.stringify({ zipCode, city: city ?? '', stateCode: stateCode ?? '' }),
    );
  },

  setGpsLocation: (lat, lng, zip, city, state) => {
    set({
      latitude: lat,
      longitude: lng,
      zipCode: zip,
      city,
      stateCode: state,
      locationSource: 'gps',
    });
    AsyncStorage.setItem(
      STORAGE_KEYS.USER_ZIPCODE,
      JSON.stringify({ zipCode: zip, city, stateCode: state }),
    );
  },

  setPermission: (permission) => set({ locationPermission: permission }),
  setLoadingLocation: (loading) => set({ isLoadingLocation: loading }),

  resetToDefault: () => {
    set({
      zipCode: DEFAULT_LOCATION.zipCode,
      latitude: DEFAULT_LOCATION.latitude,
      longitude: DEFAULT_LOCATION.longitude,
      city: DEFAULT_LOCATION.city,
      stateCode: DEFAULT_LOCATION.stateCode,
      locationSource: 'default',
    });
    AsyncStorage.removeItem(STORAGE_KEYS.USER_ZIPCODE);
  },

  restoreZipCode: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_ZIPCODE);
      if (raw) {
        const { zipCode, city, stateCode } = JSON.parse(raw);
        set({ zipCode, city: city ?? '', stateCode: stateCode ?? '', locationSource: 'manual' });
      }
    } catch {
      // Use defaults
    }
  },

  setThemeMode: (mode) => {
    set({ themeMode: mode, resolvedTheme: resolveTheme(mode) });
    AsyncStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, mode);
  },

  restoreTheme: async () => {
    try {
      const mode = (await AsyncStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE)) as ThemeMode | null;
      if (mode && ['light', 'dark', 'system'].includes(mode)) {
        set({ themeMode: mode, resolvedTheme: resolveTheme(mode) });
      }
    } catch {
      // Use defaults
    }
  },

  setAnalyticsEnabled: (enabled) => {
    set({ analyticsEnabled: enabled });
    AsyncStorage.setItem(STORAGE_KEYS.PRIVACY_PREFS, JSON.stringify({
      analyticsEnabled: enabled,
      crashReportingEnabled: get().crashReportingEnabled,
    }));
  },

  setCrashReportingEnabled: (enabled) => {
    set({ crashReportingEnabled: enabled });
    AsyncStorage.setItem(STORAGE_KEYS.PRIVACY_PREFS, JSON.stringify({
      analyticsEnabled: get().analyticsEnabled,
      crashReportingEnabled: enabled,
    }));
  },

  restorePrivacyPrefs: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.PRIVACY_PREFS);
      if (raw) {
        const { analyticsEnabled, crashReportingEnabled } = JSON.parse(raw);
        set({
          analyticsEnabled: analyticsEnabled ?? true,
          crashReportingEnabled: crashReportingEnabled ?? true,
        });
      }
    } catch {
      // Use defaults
    }
  },
}));

// Listen for system appearance changes when in 'system' mode
Appearance.addChangeListener(({ colorScheme }) => {
  const { themeMode } = useSettingsStore.getState();
  if (themeMode === 'system') {
    useSettingsStore.setState({
      resolvedTheme: colorScheme === 'dark' ? 'dark' : 'light',
    });
  }
});
