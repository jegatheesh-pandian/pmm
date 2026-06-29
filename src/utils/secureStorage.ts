/**
 * Secure storage wrapper around Expo SecureStore
 * Handles JSON serialization and error recovery
 */

import * as SecureStore from 'expo-secure-store';

export async function getSecureItem<T>(key: string): Promise<T | null> {
  try {
    const raw = await SecureStore.getItemAsync(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setSecureItem<T>(key: string, value: T): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to store ${key}:`, error);
  }
}

export async function removeSecureItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Ignore deletion errors
  }
}
