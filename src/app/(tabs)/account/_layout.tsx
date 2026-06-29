/**
 * Account Tab Stack Layout
 * Keeps tab bar visible for dashboard, medications, and settings
 */

import { Stack } from 'expo-router';

export default function AccountTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
