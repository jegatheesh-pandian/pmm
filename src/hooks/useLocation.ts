/**
 * useLocation hook
 * Manages GPS permission, current position fetching, and ZIP code geocoding
 * Integrates with settingsStore for persistent location state
 */

import { useCallback, useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import {
  requestLocationPermission,
  checkLocationPermission,
  getCurrentLocation,
  geocodeZipCode,
} from '@/services/locationService';
import type { LocationResult } from '@/services/locationService';

interface UseLocationReturn {
  /** Current ZIP code from settings */
  zipCode: string;
  /** City name */
  city: string;
  /** State abbreviation */
  stateCode: string;
  /** Current latitude */
  latitude: number;
  /** Current longitude */
  longitude: number;
  /** Whether GPS location is loading */
  isLoadingGps: boolean;
  /** Whether ZIP geocoding is loading */
  isGeocodingZip: boolean;
  /** Location permission status */
  permission: 'pending' | 'granted' | 'denied';
  /** Location source (default/gps/manual) */
  locationSource: string;
  /** Error message if any */
  error: string | null;
  /** Request GPS and update location */
  requestGps: () => Promise<LocationResult | null>;
  /** Set location from manual ZIP entry */
  setZipManually: (zip: string) => Promise<boolean>;
  /** Reset to default location */
  resetLocation: () => void;
}

export function useLocation(): UseLocationReturn {
  const {
    zipCode,
    city,
    stateCode,
    latitude,
    longitude,
    locationPermission,
    locationSource,
    isLoadingLocation,
    setGpsLocation,
    setZipCode,
    setPermission,
    setLoadingLocation,
    resetToDefault,
  } = useSettingsStore();

  const [isGeocodingZip, setIsGeocodingZip] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestGps = useCallback(async (): Promise<LocationResult | null> => {
    setError(null);
    setLoadingLocation(true);

    try {
      // Check if already granted
      let granted = await checkLocationPermission();
      if (!granted) {
        granted = await requestLocationPermission();
      }

      if (!granted) {
        setPermission('denied');
        setError('Location permission denied. Please enter your ZIP code manually.');
        return null;
      }

      setPermission('granted');

      const result = await getCurrentLocation();
      if (result.zipCode) {
        setGpsLocation(
          result.latitude,
          result.longitude,
          result.zipCode,
          result.city,
          result.stateCode,
        );
        return result;
      } else {
        setError('Unable to determine your location. Please enter your ZIP code.');
        return null;
      }
    } catch (err) {
      setError('Failed to get your location. Please try again or enter a ZIP code.');
      return null;
    } finally {
      setLoadingLocation(false);
    }
  }, [setGpsLocation, setPermission, setLoadingLocation]);

  const setZipManually = useCallback(
    async (zip: string): Promise<boolean> => {
      const cleaned = zip.replace(/\D/g, '');
      if (cleaned.length !== 5) {
        setError('Please enter a valid 5-digit ZIP code.');
        return false;
      }

      setError(null);
      setIsGeocodingZip(true);

      try {
        const result = await geocodeZipCode(cleaned);
        if (result) {
          setZipCode(cleaned, result.city, result.stateCode);
          return true;
        } else {
          // Still set the ZIP even if geocoding fails
          setZipCode(cleaned);
          return true;
        }
      } catch {
        // Set ZIP without city/state
        setZipCode(cleaned);
        return true;
      } finally {
        setIsGeocodingZip(false);
      }
    },
    [setZipCode],
  );

  const resetLocation = useCallback(() => {
    setError(null);
    resetToDefault();
  }, [resetToDefault]);

  return {
    zipCode,
    city,
    stateCode,
    latitude,
    longitude,
    isLoadingGps: isLoadingLocation,
    isGeocodingZip,
    permission: locationPermission,
    locationSource,
    error,
    requestGps,
    setZipManually,
    resetLocation,
  };
}
