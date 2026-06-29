/**
 * Conditions Tab Stack Layout
 * Keeps tab bar visible for both list and detail screens
 */

import { Stack } from 'expo-router';

export default function ConditionsTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
