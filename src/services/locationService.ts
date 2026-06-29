/**
 * Location Service
 * Wraps expo-location for GPS permission, current position, and reverse geocode
 * Ported from Angular LocationService
 *
 * ZIP geocoding priority:
 * 1. zippopotam.us (free, no key, fast)
 * 2. Google Maps Geocoding REST API (same key as Angular web app)
 * 3. expo-location geocodeAsync (requires device-level Google Play config)
 */

import * as Location from 'expo-location';

// Same Google Maps API key used in the Angular web app
const GOOGLE_MAPS_API_KEY = 'AIzaSyATvMGHEOZuJI4yG0aBY7OMySemxGcUGK4';

export interface LocationResult {
  latitude: number;
  longitude: number;
  zipCode: string;
  city: string;
  stateCode: string;
}

/** Request foreground location permission */
export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

/** Check if foreground location permission is currently granted */
export async function checkLocationPermission(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === 'granted';
}

/** Get current GPS position with reverse geocode to get ZIP/city/state */
export async function getCurrentLocation(): Promise<LocationResult> {
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = position.coords;

  // Reverse geocode to get address details
  const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });

  if (geocoded.length > 0) {
    const place = geocoded[0];
    return {
      latitude,
      longitude,
      zipCode: place.postalCode || '',
      city: place.city || place.subregion || '',
      stateCode: place.region || '',
    };
  }

  return {
    latitude,
    longitude,
    zipCode: '',
    city: '',
    stateCode: '',
  };
}

/** Create an AbortController with a timeout (Hermes doesn't support AbortSignal.timeout) */
function createTimeoutController(ms: number): { controller: AbortController; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { controller, clear: () => clearTimeout(timer) };
}

/** Geocode a ZIP code to get coordinates and city/state.
 *  Uses zippopotam.us API (free, no key needed) as primary,
 *  then Google Maps Geocoding REST API, then expo-location.
 */
export async function geocodeZipCode(zipCode: string): Promise<LocationResult | null> {
  // 1) Try free zippopotam.us API first (works without API keys)
  try {
    const { controller, clear } = createTimeoutController(5000);
    const resp = await fetch(`https://api.zippopotam.us/us/${zipCode}`, {
      signal: controller.signal,
    });
    clear();
    if (resp.ok) {
      const data = await resp.json();
      const place = data.places?.[0];
      if (place) {
        const result: LocationResult = {
          latitude: parseFloat(place.latitude) || 0,
          longitude: parseFloat(place.longitude) || 0,
          zipCode,
          city: place['place name'] || '',
          stateCode: place['state abbreviation'] || '',
        };
        console.log('[LocationService] zippopotam.us success:', result.city, result.stateCode);
        return result;
      }
    }
  } catch (err) {
    console.log('[LocationService] zippopotam.us failed:', err);
  }

  // 2) Try Google Maps Geocoding REST API (same key as Angular web app)
  try {
    const { controller, clear } = createTimeoutController(5000);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${zipCode}&components=country:US&key=${GOOGLE_MAPS_API_KEY}`;
    const resp = await fetch(url, { signal: controller.signal });
    clear();
    if (resp.ok) {
      const data = await resp.json();
      console.log('[LocationService] Google Maps status:', data.status);
      if (data.status === 'OK' && data.results?.length > 0) {
        const result = data.results[0];
        const loc = result.geometry?.location;
        let city = '';
        let stateCode = '';
        for (const comp of result.address_components || []) {
          if (comp.types?.includes('locality') || comp.types?.includes('sublocality')) {
            city = comp.long_name;
          }
          if (comp.types?.includes('administrative_area_level_1')) {
            stateCode = comp.short_name;
          }
          if (!city && (comp.types?.includes('administrative_area_level_2') || comp.types?.includes('neighborhood'))) {
            city = comp.long_name;
          }
        }
        if (city || stateCode) {
          console.log('[LocationService] Google Maps success:', city, stateCode);
          return {
            latitude: loc?.lat || 0,
            longitude: loc?.lng || 0,
            zipCode,
            city,
            stateCode,
          };
        }
      }
    }
  } catch (err) {
    console.log('[LocationService] Google Maps failed:', err);
  }

  // 3) Fallback: expo-location (requires device-level Google Play config on Android)
  try {
    console.log('[LocationService] Trying expo-location geocodeAsync...');
    const results = await Location.geocodeAsync(`${zipCode}, USA`);
    if (results.length === 0) {
      console.log('[LocationService] expo-location: no results');
      return null;
    }

    const { latitude, longitude } = results[0];

    const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (geocoded.length > 0) {
      const place = geocoded[0];
      console.log('[LocationService] expo-location success:', place.city, place.region);
      return {
        latitude,
        longitude,
        zipCode: place.postalCode || zipCode,
        city: place.city || place.subregion || '',
        stateCode: place.region || '',
      };
    }

    return { latitude, longitude, zipCode, city: '', stateCode: '' };
  } catch (err) {
    console.log('[LocationService] expo-location failed:', err);
    return null;
  }
}

/**
 * Lookup ZIP code for preview only (city/state) without setting location.
 * Matches Angular LocationService.lookupZipCode()
 */
export async function lookupZipCode(zipCode: string): Promise<{ city: string; stateCode: string } | null> {
  if (!zipCode || !/^\d{5}$/.test(zipCode)) return null;

  console.log('[LocationService] lookupZipCode called for:', zipCode);
  const result = await geocodeZipCode(zipCode);
  console.log('[LocationService] lookupZipCode result:', result);
  if (result?.city) {
    return { city: result.city, stateCode: result.stateCode };
  }
  return null;
}

/**
 * Calculate distance between two points in miles using Haversine formula
 */
export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export const locationService = {
  requestLocationPermission,
  checkLocationPermission,
  getCurrentLocation,
  geocodeZipCode,
  lookupZipCode,
  calculateDistanceMiles,
};
