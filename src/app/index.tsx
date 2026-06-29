/**
 * Root index - redirects to the main tab navigation
 */

import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(tabs)" />;
}
